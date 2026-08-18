import { Head, Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';

export default function StudentFeesLocked() {
    return (
        <>
            <Head title="Account Locked" />
            <div className="flex min-h-svh flex-col items-center justify-center bg-[#0F1A32] p-6">
                <div className="mb-8">
                    <AppLogo />
                </div>
                <Card className="w-full max-w-md border-destructive/30">
                    <CardHeader className="space-y-3 text-center">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="size-6 text-destructive" />
                        </div>
                        <CardTitle className="text-xl">
                            Access restricted — fees outstanding
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
                        <p>
                            Your login is valid, but your account is locked
                            until required fees are paid. You can view your
                            profile or proceed to payment.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                            <Button asChild>
                                <Link href="/student/fees">Pay now</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={edit()}>View profile</Link>
                            </Button>
                        </div>
                        <Button variant="ghost" asChild className="text-xs">
                            <Link href={logout()} as="button">
                                Log out
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
