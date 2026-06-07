'use client';

import { signOut } from "next-auth/react";

export function LogoutButton() {

    return <button className="p-3 bg-black text-white rounded-lg" onClick={async () => {
        await signOut({ redirect: false });
        window.location.href = "/";
    }}>Sign out</button>
}