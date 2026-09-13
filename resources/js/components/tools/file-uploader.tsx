import { Trash2, Upload } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useReducer,
    useRef,
} from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ValidationError {
    fileName: string;
    type: 'SIZE' | 'TYPE' | 'COUNT';
    message: string;
}

export interface FileUploaderProps {
    id?: string;
    name?: string;
    /** MIME types (e.g. `image/jpeg`), wildcards (`image/*`), and/or extensions (e.g. `.pdf`). Empty allows any type. */
    accept?: string[];
    maxSizeMB?: number;
    maxFiles?: number;
    multiple?: boolean;
    onFilesChange?: (files: File[]) => void;
    className?: string;
    disabled?: boolean;
    title?: string;
    description?: string;
}

interface UploaderState {
    files: File[];
    errors: ValidationError[];
    isDragging: boolean;
    activeIndex: number;
}

type UploaderAction =
    | { type: 'SET_DRAGGING'; payload: boolean }
    | {
          type: 'ADD_FILES';
          payload: {
              files: File[];
              errors: ValidationError[];
              multiple: boolean;
          };
      }
    | { type: 'REMOVE_FILE'; payload: number }
    | { type: 'SET_ERRORS'; payload: ValidationError[] }
    | { type: 'SET_ACTIVE'; payload: number };

const uploaderReducer = (
    state: UploaderState,
    action: UploaderAction,
): UploaderState => {
    switch (action.type) {
        case 'SET_DRAGGING':
            return { ...state, isDragging: action.payload };
        case 'ADD_FILES': {
            const {
                files: incoming,
                errors,
                multiple: isMulti,
            } = action.payload;

            if (incoming.length === 0 && errors.length > 0) {
                return { ...state, errors };
            }

            const updatedFiles = isMulti
                ? [...state.files, ...incoming]
                : incoming[0]
                  ? [incoming[0]]
                  : state.files;
            const nextActive =
                incoming.length > 0
                    ? isMulti
                        ? Math.max(0, state.files.length + incoming.length - 1)
                        : 0
                    : state.activeIndex;

            return {
                ...state,
                files: updatedFiles,
                errors,
                activeIndex: Math.min(
                    nextActive,
                    Math.max(0, updatedFiles.length - 1),
                ),
            };
        }
        case 'REMOVE_FILE': {
            const next = state.files.filter((_, idx) => idx !== action.payload);
            const nextActive = Math.min(
                state.activeIndex,
                Math.max(0, next.length - 1),
            );

            return {
                ...state,
                files: next,
                errors: [],
                activeIndex: nextActive,
            };
        }
        case 'SET_ERRORS':
            return { ...state, errors: action.payload };
        case 'SET_ACTIVE':
            return { ...state, activeIndex: action.payload };
        default:
            return state;
    }
};

export function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getExtension(name: string): string {
    const parts = name.split('.');

    return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

/**
 * Returns true when `accept` is empty, or the file matches at least one accept token
 * (MIME, `category/*`, or leading-dot extension).
 */
export function fileMatchesAccept(file: File, accept: string[]): boolean {
    if (accept.length === 0) {
        return true;
    }

    const ext = getExtension(file.name);
    const mime = (file.type || '').toLowerCase();

    return accept.some((raw) => {
        const token = raw.trim().toLowerCase();

        if (!token) {
            return false;
        }

        if (token.startsWith('.')) {
            return ext === token.slice(1);
        }

        if (token.endsWith('/*')) {
            const prefix = token.slice(0, -1);

            return mime.startsWith(prefix);
        }

        return mime === token;
    });
}

function summarizeAccept(accept: string[]): string {
    if (accept.length === 0) {
        return 'Any file type';
    }

    return accept
        .map((t) => {
            const s = t.trim();

            if (s.startsWith('.')) {
                return s.toUpperCase();
            }

            if (s.includes('/')) {
                return s.split('/').pop() ?? s;
            }

            return s;
        })
        .join(', ');
}

interface DropZoneProps {
    isDragging: boolean;
    disabled: boolean;
    inputId: string;
    desc: string;
    onTriggerClick: () => void;
}

function DropZone({
    isDragging,
    disabled,
    inputId,
    desc,
    onTriggerClick,
}: DropZoneProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onTriggerClick}
            aria-controls={inputId}
            className={cn(
                'flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background p-4 text-center transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                isDragging && 'border-primary bg-primary/5',
                disabled && 'pointer-events-none opacity-50',
            )}
        >
            <Upload className="size-6 text-muted-foreground" aria-hidden />
            <div className="space-y-1">
                <p className="text-sm font-medium">
                    <span className="text-primary">Click to upload</span>
                    <span className="text-muted-foreground">
                        {' '}
                        or drag and drop
                    </span>
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
        </button>
    );
}

function ErrorAlerts({ errors }: { errors: ValidationError[] }) {
    if (errors.length === 0) {
        return null;
    }

    return (
        <div
            role="alert"
            className="space-y-1 rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
            {errors.map((err, idx) => (
                <div
                    key={`${err.type}-${err.fileName}-${idx}`}
                    className="flex gap-2"
                >
                    <span className="shrink-0 font-medium">{err.fileName}</span>
                    <span className="min-w-0">{err.message}</span>
                </div>
            ))}
        </div>
    );
}

export function FileUploader({
    id,
    name = 'files',
    accept = [],
    maxSizeMB = 5,
    maxFiles = 1,
    multiple = false,
    onFilesChange,
    className,
    disabled = false,
    description,
}: FileUploaderProps) {
    const reactId = useId();
    const inputId = id ?? `file-upload-${reactId}`;
    const [state, dispatch] = useReducer(uploaderReducer, {
        files: [],
        errors: [],
        isDragging: false,
        activeIndex: 0,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const maxBytes = maxSizeMB * 1024 * 1024;
    const acceptLabel = useMemo(() => summarizeAccept(accept), [accept]);

    const fileKeys = useMemo(
        () =>
            state.files.map(
                (f, i) => `${f.name}-${f.size}-${f.lastModified}-${i}`,
            ),
        [state.files],
    );

    const objectUrls = useMemo(() => {
        const map = new Map<string, string>();
        state.files.forEach((file, i) => {
            map.set(fileKeys[i]!, URL.createObjectURL(file));
        });

        return map;
    }, [state.files, fileKeys]);

    useEffect(() => {
        return () => {
            objectUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [objectUrls]);

    const validateAndDispatch = useCallback(
        (incomingFiles: File[]) => {
            const list = multiple ? incomingFiles : incomingFiles.slice(0, 1);
            const freshErrors: ValidationError[] = [];
            const passingFiles: File[] = [];

            if (multiple && state.files.length + list.length > maxFiles) {
                freshErrors.push({
                    fileName: 'Selection',
                    type: 'COUNT',
                    message: `You can upload at most ${maxFiles} files (currently ${state.files.length} selected).`,
                });
                dispatch({ type: 'SET_ERRORS', payload: freshErrors });

                return;
            }

            if (!multiple && list.length > 1) {
                freshErrors.push({
                    fileName: 'Selection',
                    type: 'COUNT',
                    message: 'Only one file is allowed.',
                });
                dispatch({ type: 'SET_ERRORS', payload: freshErrors });

                return;
            }

            list.forEach((file) => {
                if (accept.length > 0 && !fileMatchesAccept(file, accept)) {
                    freshErrors.push({
                        fileName: file.name,
                        type: 'TYPE',
                        message: `File type is not allowed. Accepted: ${acceptLabel}.`,
                    });

                    return;
                }

                if (file.size > maxBytes) {
                    freshErrors.push({
                        fileName: file.name,
                        type: 'SIZE',
                        message: `File is too large (${formatBytes(file.size)}). Maximum is ${maxSizeMB} MB.`,
                    });

                    return;
                }

                passingFiles.push(file);
            });

            dispatch({
                type: 'ADD_FILES',
                payload: { files: passingFiles, errors: freshErrors, multiple },
            });

            if (onFilesChange && passingFiles.length > 0) {
                const nextFiles = multiple
                    ? [...state.files, ...passingFiles]
                    : [passingFiles[0]!];
                onFilesChange(nextFiles);
            }
        },
        [
            accept,
            acceptLabel,
            maxBytes,
            maxFiles,
            maxSizeMB,
            multiple,
            onFilesChange,
            state.files,
        ],
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            validateAndDispatch(Array.from(e.target.files));
        }

        e.target.value = '';
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        dispatch({ type: 'SET_DRAGGING', payload: false });

        if (e.dataTransfer.files?.length) {
            validateAndDispatch(Array.from(e.dataTransfer.files));
        }
    };

    const removeFileAtIndex = (index: number) => {
        dispatch({ type: 'REMOVE_FILE', payload: index });

        if (onFilesChange) {
            onFilesChange(state.files.filter((_, idx) => idx !== index));
        }
    };

    const acceptAttr = accept.join(',');

    return (
        <div className={cn('w-full space-y-1', className)}>
            <Card className="border-none bg-transparent p-0 shadow-none">
                <CardContent className="space-y-1 p-0">
                    {state.files.length < 1 && (
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();

                                if (!disabled) {
                                    dispatch({
                                        type: 'SET_DRAGGING',
                                        payload: true,
                                    });
                                }
                            }}
                            onDragLeave={() =>
                                dispatch({
                                    type: 'SET_DRAGGING',
                                    payload: false,
                                })
                            }
                            onDrop={disabled ? undefined : handleDrop}
                        >
                            <DropZone
                                isDragging={state.isDragging}
                                disabled={disabled}
                                inputId={inputId}
                                desc={description ? description : ''}
                                onTriggerClick={() => {
                                    if (!disabled) {
                                        fileInputRef.current?.click();
                                    }
                                }}
                            />
                            <input
                                id={inputId}
                                name={name}
                                type="file"
                                ref={fileInputRef}
                                onChange={handleInputChange}
                                accept={acceptAttr || undefined}
                                multiple={multiple}
                                disabled={disabled}
                                className="sr-only"
                            />
                        </div>
                    )}

                    <ErrorAlerts errors={state.errors} />

                    {/* {state.files.length > 0 && activeFile && activeObjectUrl && (
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div className="space-y-2">
                                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Preview</p>
                                <PreviewPane
                                    file={activeFile}
                                    objectUrl={activeObjectUrl}
                                    onImageLoad={(w, h) => {
                                        if (activeKey) {
                                            setDimsForKey(activeKey, w, h);
                                        }
                                    }}
                                />
                            </div>
                            <div className="space-y-3">
                                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Metadata</p>
                                <FileMetadata
                                    file={activeFile}
                                    imageDimensions={activeKey ? imageDimsByKey[activeKey] ?? null : null}
                                />
                            </div>
                        </div>
                    )} */}

                    {state.files.length > 0 && (
                        <ul className="divide-y divide-border rounded-md border border-border">
                            {state.files.map((file, index) => {
                                const key = fileKeys[index]!;
                                const thumbUrl = objectUrls.get(key);
                                const isImage = file.type.startsWith('image/');

                                return (
                                    <li
                                        key={key}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2',
                                            index === state.activeIndex &&
                                                'bg-muted/40',
                                        )}
                                    >
                                        <button
                                            type="button"
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                            onClick={() =>
                                                dispatch({
                                                    type: 'SET_ACTIVE',
                                                    payload: index,
                                                })
                                            }
                                        >
                                            {isImage && thumbUrl ? (
                                                <img
                                                    src={thumbUrl}
                                                    alt=""
                                                    className="size-10 shrink-0 rounded bg-muted object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                                                    {(
                                                        getExtension(
                                                            file.name,
                                                        ) || '?'
                                                    )
                                                        .slice(0, 4)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatBytes(file.size)}
                                                </p>
                                            </div>
                                        </button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                removeFileAtIndex(index)
                                            }
                                            disabled={disabled}
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
