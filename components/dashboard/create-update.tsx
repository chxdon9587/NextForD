"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { createPostUpdate } from "@/app/actions/updates";

interface CreateUpdateProps {
  projectId: string;
  onUpdate?: () => void;
}

export default function CreateUpdateDialog({ projectId, onUpdate }: CreateUpdateProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "backers_only">("public");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in the title and content");
      return;
    }

    setLoading(true);

    const result = await createPostUpdate({
      projectId,
      title: title.trim(),
      content: content.trim(),
      visibility,
      images: imageUrls,
    });

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else if (result.success) {
      setTitle("");
      setContent("");
      setVisibility("public");
      setImageUrls([]);
      alert("Update posted successfully!");
      onUpdate?.();
    }

    setLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const supabase = createClient();

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-${Date.now()}-${i}.${fileExt}`;
      const filePath = `project-updates/${fileName}`;

      try {
        const { data, error } = await supabase.storage
          .from('projects')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('projects')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }

    setImageUrls(uploadedUrls);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Project Update</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e: any) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              placeholder="Update title..."
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e: any) => setContent(e.target.value)}
              placeholder="Share your progress with backers..."
              rows={6}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e: any) => setVisibility(e.target.value)}
              disabled={loading}
              className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="backers_only">Backers Only</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Public updates are visible to everyone. Backers-only updates are only visible to people who have backed this project.
            </p>
          </div>

          <div>
            <Label htmlFor="images">Images (Optional)</Label>
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={loading}
            />
            {imageUrls.length > 0 && (
              <div className="flex gap-2 mt-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24">
                    <img
                      src={url}
                      alt={`Update image ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrls(imageUrls.filter((_, i) => i !== index));
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? "Posting..." : "Post Update"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onUpdate?.()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
