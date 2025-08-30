import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreVertical, File, Download } from "lucide-react";

interface PostHeaderProps {
  username: string;
  university: string;
  createdAt: string;
  caption?: string;
  fileUrl?: string;
}

const isFileUrl = (url: string) =>
  url && !/\.(jpg|jpeg|png|gif|webp)$/i.test(url);

const getFileNameFromUrl = (url: string) => {
  if (url.includes("placeholder.com")) {
    const match = url.match(/text=(.+)/);
    return match ? decodeURIComponent(match[1]) : "File";
  }
  return url.split("/").pop() || "File";
};

export default function PostHeader({
  username,
  university,
  createdAt,
  caption,
  fileUrl,
}: PostHeaderProps) {
  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Top Row: Avatar + Username/University + Menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} />
            <AvatarFallback>{username[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{username}</span>
              <span className="text-sm text-muted-foreground">@{university}</span>
              <span className="text-xs text-muted-foreground">· {createdAt}</span>
            </div>
          </div>
        </div>

        {/* Dots button - made smaller */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-sm text-foreground">{caption}</p>
      )}

      {/* File Download Section */}
      {fileUrl && isFileUrl(fileUrl) && (
        <div
          onClick={handleDownload}
          className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:underline"
        >
          <File className="h-4 w-4" />
          {getFileNameFromUrl(fileUrl)}
          <Download className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
