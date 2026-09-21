import { Head, usePage } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

type PageProps = {
    auth: {
        user: {
            preferred_language?: string;
        };
    };
};

export default function Language() {
    const { t } = useTranslation();
    const { language, setLanguage } = useLanguage();
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title={t('language_settings')} />

            <h1 className="sr-only">{t('language_settings')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('language_settings')}
                    description={t('language_settings_description')}
                />

                <Form
                    method="POST"
                    action="/settings/language"
                    className="space-y-6"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="language" className="flex items-center gap-2">
                            <Languages className="h-4 w-4" />
                            {t('select_language')}
                        </Label>

                        <Select
                            name="language"
                            defaultValue={auth.user.preferred_language || language}
                            onValueChange={(value) => {
                                setLanguage(value as 'en' | 'ar');
                            }}
                        >
                            <SelectTrigger id="language" className="mt-1 w-full">
                                <SelectValue placeholder={t('select_language')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">{t('english_language')}</SelectItem>
                                <SelectItem value="ar">{t('arabic_language')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button type="submit" data-test="save-language-button">
                            {t('save_button')}
                        </Button>
                    </div>
                </Form>
            </div>
        </>
    );
}

Language.layout = () => {
    const { t } = useTranslation();
    return {
        breadcrumbs: [
            {
                title: t('language_settings'),
                href: '/settings/language',
            },
        ],
    };
};
