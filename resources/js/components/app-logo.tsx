import uctLogo from '@/components/images/uct-logo__white-01.svg';

export default function AppLogo() {
    return (
        <>
            <div className="flex items-center justify-center">
                <img
                    src={uctLogo}
                    alt="UCT Management Logo"
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