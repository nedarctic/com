'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loginAction } from "@/actions/auth.actions"
import { useState } from "react";
import { useRouter } from "next/navigation"
import React from "react"
import { signIn } from "next-auth/react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>('')

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    try {
      setLoading(true);
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/"
      });
      setLoading(false);

      // const { success, error }: { success: boolean, error?: string } = await res.json();
      if (!response?.ok) {
        setError(response?.error!);
        console.log(response?.error!);
      }
      setError(undefined);
      router.push(`${response?.url ?? '/'}`);
    } catch (error) {
      setError(String(error));
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" name="password" type="password" required />
              </Field>
              <Field>
                <Button disabled={loading} type="submit">{loading ? "Logging in..." : "Login"}</Button>
              </Field>
              {error && <Field>
                <p className="text-red-600">{error}</p>
              </Field>}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
