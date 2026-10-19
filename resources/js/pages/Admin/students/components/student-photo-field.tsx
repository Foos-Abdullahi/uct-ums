import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StudentPhotoFieldProps {
    currentPhotoUrl?: string | null;
    error?: string;
    onChange: (photo: File | null) => void;
}

export function StudentPhotoField({
    currentPhotoUrl,
    error,
    onChange,
}: StudentPhotoFieldProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        currentPhotoUrl ?? null,
    );

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleChange = (file: File | null) => {
        if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(
            file ? URL.createObjectURL(file) : (currentPhotoUrl ?? null),
        );
        onChange(file);
    };

    return (
        <div className="flex flex-col gap-4 rounded-lg border border-dashed border-border p-4 sm:flex-row sm:items-center">
            <Avatar className="size-20 border-2 border-primary/15">
                <AvatarImage
                    src={previewUrl ?? undefined}
                    alt="Student photo preview"
                    className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                    <Camera className="size-7" />
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 gap-2">
                <Label htmlFor="photo">Student Photo</Label>
                <Input
                    id="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                        handleChange(event.target.files?.[0] ?? null)
                    }
                />
                <p className="text-xs text-muted-foreground">
                    JPG, PNG, or WebP. Maximum file size: 2 MB.
                </p>
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
        </div>
    );
}
