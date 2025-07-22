// features/users/components/PaginatedNavigation.tsx
'use client';

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginatedNavigationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const PaginatedNavigation = ({
    currentPage,
    totalPages,
    onPageChange,
}: PaginatedNavigationProps) => {
    if (totalPages <= 1) return null;

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    />
                </PaginationItem>

                {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                        <PaginationLink
                            isActive={currentPage === i + 1}
                            onClick={() => onPageChange(i + 1)}
                        >
                            {i + 1}
                        </PaginationLink>
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <PaginationNext
                        onClick={() =>
                            onPageChange(Math.min(currentPage + 1, totalPages))
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
