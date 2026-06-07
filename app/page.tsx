import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { LogoutButton } from "@/components/logout-button";
import type { Book } from "@/types/book";

export async function getBooks(): Promise<{ success: boolean; error?: string; data?: any }> {

  const session = await getServerSession(authOptions);
  const access_token = session?.accessToken;

  console.log('payload:',
    JSON.parse(
      Buffer.from(
        access_token!.split(".")[1],
        "base64"
      ).toString()
    )
  );
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/books`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!res.ok) {
      const errorMessage = await res.json();
      return { success: false, error: errorMessage };
    }

    const data = await res.json();
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export default async function Page() {

  const { success, error, data }: { success: boolean, error?: string, data?: Book[] } = await getBooks();

  return (
    <div className="flex flex-col min-h-screen w-full p-10 space-y-6">
      <div className="flex justify-between items-center">
        <p className="font-bold text-xl">Bookstore</p>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.map(({ id, author, description, title, genre, price }) => (
          <div key={id} className="flex flex-col border-2 border-black rounded-xl p-6 space-y-2">
            <p className="font-extrabold text-xl">{title}</p>
            <p className="italic font-normal">By <span className="font-bold text-md">{author}</span></p>
            <p>Genre: <span className="italic font-semibold text-sm">{genre}</span></p>
            <p>{description}</p>
            <p>Price: ${price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}