import uctFavicon from '@/components/images/favicon (1)/favicon-96x96.png';

export default function AppLogoIcon({ className }: { className?: string }) {
    return (
        <img
            src={uctFavicon}
            alt="UCT University"
            className={className ?? 'h-8 w-8 object-contain'}
        />
    );
}
