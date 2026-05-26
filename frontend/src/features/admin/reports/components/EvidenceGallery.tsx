import { Dialog, DialogContent, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Image, Video, File } from 'lucide-react';

export const EvidenceGallery = ({ urls }: { urls: string[] }) => {
  if (!urls?.length) return <p className="text-muted-foreground text-sm">Không có bằng chứng</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url, i) => (
        <Dialog key={i}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {url.match(/\.(mp4|webm|mov)/i) ? (
                <Video className="h-3 w-3" />
              ) : url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                <Image className="h-3 w-3" />
              ) : (
                <File className="h-3 w-3" />
              )}
              Xem #{i + 1}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            {url.match(/\.(mp4|webm|mov)/i) ? (
              <video src={url} controls className="w-full" />
            ) : (
              <img src={url} alt="Evidence" className="w-full" />
            )}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};
