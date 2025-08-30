import React from "react";
import { File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostContentProps {
  content: string;
  imageUrl?: string;
}

const isImageUrl = (url: string) => {
  return (
    url.includes("placeholder.com") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  );
};

const getFileNameFromUrl = (url: string) => {
  if (url.includes("placeholder.com")) {
    const match = url.match(/text=(.+)/);
    return match ? decodeURIComponent(match[1]) : "File";
  }
  return url.split("/").pop() || "File";
};

export default function PostContent({ content, imageUrl }: PostContentProps) {
  const handleDownload = () => {
    if (imageUrl) {
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <div className="ml-14 mt-1 space-y-3">
      {/* Caption */}
      {content && (
        <p className="text-foreground leading-relaxed whitespace-pre-line break-words">
          {content}
        </p>
      )}

      {/* Image or file preview */}
      {imageUrl && (
        <div className="rounded-xl overflow-hidden">
          {isImageUrl(imageUrl) ? (
            <img
              src={imageUrl}
              alt="Post content"
              className="w-full h-auto object-cover max-h-96 rounded-xl"
            />
          ) : (
            <div className="bg-muted/20 border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">
                    {getFileNameFromUrl(imageUrl)}
                  </p>
                  <p className="text-sm text-muted-foreground">Attached file</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
