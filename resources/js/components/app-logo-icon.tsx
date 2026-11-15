import fcsisLogo from '@/components/images/fcsis-logo.png';

export default function AppLogoIcon({ className }: { className?: string }) {
    return (
        <img
            src={fcsisLogo}
            alt="Faculty of Computer Science and Information Systems logo"
            className={className ?? 'h-8 w-8 object-contain'}
        />
    );
}
