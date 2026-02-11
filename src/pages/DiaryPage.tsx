import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function DiaryPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; type: "image" | "video"; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create diary entry mutation
  const createEntryMutation = trpc.diary.create.useMutation({
    onSuccess: () => {
      toast.success("Diary entry saved!");
      setTitle("");
      setContent("");
      setUploadedFiles([]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save entry");
    },
  });

  // Upload media mutation
  const uploadMediaMutation = trpc.media.upload.useMutation({
    onSuccess: (result: any) => {
      if (result) {
        const fileUrl = result.fileUrl || "";
        const fileType = result.fileType || "image";
        const fileName = result.fileName || "File";
        setUploadedFiles([...uploadedFiles, { url: fileUrl, type: fileType, name: fileName }]);
        toast.success("File uploaded successfully!");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload file");
    },
  });


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error("Only images and videos are supported");
        continue;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(",")[1];
        if (!base64) return;

        await uploadMediaMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          fileType: isImage ? "image" : "video",
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveEntry = async () => {
    if (!title.trim() && !content.trim()) {
      toast.error("Please add a title or content");
      return;
    }

    setIsLoading(true);
    try {
      await createEntryMutation.mutateAsync({
        title: title || undefined,
        content: content || undefined,
        date: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">New Diary Entry</h1>
            <p className="text-muted-foreground">Write about your day and add photos or videos</p>
          </div>
        </div>

        {/* Entry Form */}
        <Card className="card-elevated mb-6">
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title (Optional)</label>
              <Input
                placeholder="Give your entry a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">What's on your mind?</label>
              <Textarea
                placeholder="Write your thoughts, feelings, and experiences..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-48"
              />
            </div>
          </CardContent>
        </Card>

        {/* Media Upload */}
        <Card className="card-elevated mb-6">
          <CardHeader>
            <CardTitle>Add Photos & Videos</CardTitle>
            <CardDescription>Upload images or videos to attach to this entry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Upload Button */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, MP4, WebM up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type === "image" ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-accent hover:bg-accent/90 text-white"
            onClick={handleSaveEntry}
            disabled={isLoading || createEntryMutation.isPending}
          >
            {isLoading ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </div>
  );
}
