import { PortalPlaceholder } from '@/components/portal-placeholder';

const href = '/registrar/transcripts';

export default function RegistrarTranscriptsIndex() {
    return <PortalPlaceholder title="Transcripts" portal="Registrar" />;
}

RegistrarTranscriptsIndex.layout = {
    breadcrumbs: [{ title: 'Transcripts', href }],
};
