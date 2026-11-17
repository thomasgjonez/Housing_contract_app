import { AuthForm } from "@/components/AuthForm";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={next ?? "/"} />;
}
