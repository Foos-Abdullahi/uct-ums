import {
    BarChart,
    Ellipsis,
    Fullscreen,
    Pencil,
    PenLine,
    Trash2,
    UserRoundX,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../../ui/tooltip';

interface DataTableRowActionsProps<TData> {
    row: TData | null;
    title: string;
}

interface ActionItemsProps {
    title: string;
    onClick: () => void;
    Icon: React.ReactNode;
}
const ActionItems = ({ title, Icon, onClick }: ActionItemsProps) => {
    return (
        <div className="flex gap-2">
            <Tooltip>
                <TooltipTrigger>
                    <div
                        onClick={onClick}
                        className="flex cursor-pointer gap-2 rounded-sm border border-transparent p-1 px-2 duration-200 ease-in-out hover:border-primary hover:bg-primary/5 dark:hover:border-teal-400 dark:hover:bg-transparent dark:hover:text-teal-400"
                    >
                        {Icon}
                    </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-md backdrop-blur-md">
                    <h2 className="text-xs font-medium">{title}</h2>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export function ManageActions<TData>({
    row,
    title,
}: DataTableRowActionsProps<TData>) {
    const [viewOpen, setViewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // const closeEditModal = () => {
    //     setEditOpen(false);
    //     // Ensure this only affects the UpdateCurrency modal and nothing else.
    // };

    const handleView = () => {
        if (!row) {
return;
}

        setViewOpen(true);
    };

    const handleEdit = () => {
        setEditOpen(true);

        if (title == 'Submissions') {
            toast('Manage Submission Details');
        }
        // Ensure this only affects the UpdateCurrency modal and nothing else.
    };

    const handleDelete = () => {
        setDeleteOpen(true);
        // Ensure this only affects the UpdateCurrency modal and nothing else.
    };

    return (
        <>
            <div className="flex w-full items-end justify-end">
                {title == 'Applicants' ? (
                    <div className="flex gap-2">
                        <ActionItems
                            title="View Details"
                            onClick={() => handleView()}
                            Icon={
                                <>
                                    {' '}
                                    <Fullscreen size={18} />{' '}
                                </>
                            }
                        />
                    </div>
                ) : title == 'Category' ? (
                    <div className="flex gap-2">
                        {/* <ActionItems title="View" onClick={() => handleView() } Icon={ <> <Fullscreen size={18}/> </> }/> */}
                        <ActionItems
                            title="Edit"
                            onClick={() => handleEdit()}
                            Icon={
                                <>
                                    {' '}
                                    <PenLine size={18} />{' '}
                                </>
                            }
                        />
                        <ActionItems
                            title="Delete"
                            onClick={() => handleDelete()}
                            Icon={
                                <>
                                    {' '}
                                    <Trash2 size={18} />{' '}
                                </>
                            }
                        />
                    </div>
                ) : title == 'Sub-Category' ? (
                    <div className="flex gap-2">
                        {/* <ActionItems title="View" onClick={() => handleView() } Icon={ <> <Fullscreen size={18}/> </> }/> */}
                        <ActionItems
                            title="Edit"
                            onClick={() => handleEdit()}
                            Icon={
                                <>
                                    {' '}
                                    <PenLine size={18} />{' '}
                                </>
                            }
                        />
                        <ActionItems
                            title="Delete"
                            onClick={() => handleDelete()}
                            Icon={
                                <>
                                    {' '}
                                    <Trash2 size={18} />{' '}
                                </>
                            }
                        />
                    </div>
                ) : title == 'Service' ? (
                    <div className="flex gap-2">
                        {/* <ActionItems title="View" onClick={() => handleView() } Icon={ <> <Fullscreen size={18}/> </> }/> */}
                        <ActionItems
                            title="Edit"
                            onClick={() => handleEdit()}
                            Icon={
                                <>
                                    {' '}
                                    <PenLine size={18} />{' '}
                                </>
                            }
                        />
                        <ActionItems
                            title="Delete"
                            onClick={() => handleDelete()}
                            Icon={
                                <>
                                    {' '}
                                    <Trash2 size={18} />{' '}
                                </>
                            }
                        />
                    </div>
                ) : title == 'Sub-Service' ? (
                    <div className="flex gap-2">
                        {/* <ActionItems title="View" onClick={() => handleView() } Icon={ <> <Fullscreen size={18}/> </> }/> */}
                        <ActionItems
                            title="Edit"
                            onClick={() => handleEdit()}
                            Icon={
                                <>
                                    {' '}
                                    <PenLine size={18} />{' '}
                                </>
                            }
                        />
                        <ActionItems
                            title="Delete"
                            onClick={() => handleDelete()}
                            Icon={
                                <>
                                    {' '}
                                    <Trash2 size={18} />{' '}
                                </>
                            }
                        />
                    </div>
                ) : title == 'compliance-tasks' ? (
                    <div className="flex gap-2">
                        <ActionItems
                            title="View Details"
                            onClick={() => handleView()}
                            Icon={
                                <>
                                    {' '}
                                    <Fullscreen size={18} />{' '}
                                </>
                            }
                        />
                    </div>
                ) : title == 'document-review' ? (
                    <div className="flex gap-2">
                        <ActionItems
                            title="View Details"
                            onClick={() => setViewOpen(true)}
                            Icon={
                                <>
                                    {' '}
                                    <Fullscreen size={18} />{' '}
                                </>
                            }
                        />
                    </div>
                ) : title == 'investigate-cases' ? (
                    <div className="flex gap-2">
                        <ActionItems
                            title="View Details"
                            onClick={() => handleView()}
                            Icon={
                                <>
                                    {' '}
                                    <Fullscreen size={18} />{' '}
                                </>
                            }
                        />
                    </div>
                ) : title == 'Users' ? (
                    <div className="flex justify-end gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewOpen(true)}
                                    >
                                        <BarChart className="h-4 w-4" />
                                        <span className="sr-only">Details</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View details</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditOpen(true)}
                                    >
                                        <PenLine className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit form</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeleteOpen(true)}
                                    >
                                        <UserRoundX className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete User</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ) : title == 'Roles' ? (
                    <div className="flex justify-end gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewOpen(true)}
                                    >
                                        <BarChart className="h-4 w-4" />
                                        <span className="sr-only">Details</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View details</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <PenLine className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Role</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeleteOpen(true)}
                                    >
                                        <UserRoundX className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete User</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button
                                variant="ghost"
                                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                            >
                                <Ellipsis className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px]">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation(); // Correct stopPropagation usage
                                    handleView(); // Only trigger edit modal
                                }}
                                className="cursor-pointer"
                            >
                                <Fullscreen /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation(); // Correct stopPropagation usage
                                    handleEdit(); // Only trigger edit modal
                                }}
                                className="cursor-pointer"
                            >
                                <Pencil /> Manage
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(); // Trigger delete modal if needed
                                }}
                                className="cursor-pointer"
                            >
                                <Trash2 /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {viewOpen && (
                <div>
                    {/* View Modal Component */}
                    {/* Implement your view modal here */}
                </div>
            )}
            {editOpen && (
                <div>
                    {/* Edit Modal Component */}
                    {/* Implement your edit modal here */}
                </div>
            )}
            {deleteOpen && (
                <div>
                    {/* Delete Modal Component */}
                    {/* Implement your delete modal here */}
                </div>
            )}
        </>
    );
}
