import fcsisLogo from '@/components/images/fcsis-logo.png';

export default function AppLogo() {
    return (
        <>
            <div className="flex items-center justify-center">
                <img
                    src={fcsisLogo}
                    alt="Faculty of Computer Science and Information Systems logo"
                    className="h-10 w-auto object-contain"
                />
            </div>

            <div className="grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">
                    UCT Management
                </span>
            </div>
        </>
    );
}
