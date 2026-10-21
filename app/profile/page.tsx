import type { Metadata } from "next"
import { ProfileForm } from "@/components/profile-form"

export const metadata: Metadata = {
  title: "Profiili",
}

export default function ProfilePage() {
  return <ProfileForm />
}
