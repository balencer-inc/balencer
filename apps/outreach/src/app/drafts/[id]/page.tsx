import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DraftRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/drafts?selected=${id}`);
}
