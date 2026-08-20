import React from 'react';
interface HighlightedCellProps {
    text: string;
    searchTerm: string;
    className?: string;
}

export const HighlightedCell: React.FC<HighlightedCellProps> = ({
    text,
    searchTerm,
    className = 'flex px-3 items-center',
}) => {
    if (!searchTerm || !text) {
        return (
            <div className={className}>
                <span>{text}</span>
            </div>
        );
    }

    // Create a regex to match the search term case-insensitive
    const regex = new RegExp(`(${searchTerm})`, 'gi');

    // Split the text by the matches
    const parts = text.split(regex);

    return (
        <div className={`${className} first-letter:uppercase`}>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span
                        key={i}
                        className="bg-yellow-200 font-medium dark:bg-yellow-800"
                    >
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                ),
            )}
        </div>
    );
};
