import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { LogoutButton } from "@/components/logout-button";

export async function getBooks(): Promise<{ success: boolean; error?: string; data?: any }> {

  const session = await getServerSession(authOptions);
  const access_token = session?.accessToken;

  console.log('Access token at the books server component:', access_token);

  console.log('payload:',
    JSON.parse(
      Buffer.from(
        access_token!.split(".")[1],
        "base64"
      ).toString()
    )
  );
  try {
    console.log('Access token inside the server component try block:', access_token)
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/books`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!res.ok) {
      const errorMessage = await res.json();
      console.log('Error message:', errorMessage)
      return { success: false, error: errorMessage };
    }

    const data = await res.json();
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export default async function Page() {

  const { success, error, data }: { success: boolean, error?: string, data?: any } = await getBooks();


  if (!success) {
    console.error('An error occurred while getting books:', error);
  } else {
    console.log('Books data:', data);
  }



  return (
    <div className="flex flex-col min-h-screen w-full p-10">
      <div className="flex justify-between items-center">
        <p className="font-bold text-xl">Bookstore</p>
        <LogoutButton />
      </div>

    </div>
  );
}