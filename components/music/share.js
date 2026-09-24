import toast from "react-hot-toast";

export async function shareAlbum(id) {
  try {
    await navigator.clipboard.writeText(
      `${window.location.origin}/albums/${encodeURIComponent(id)}`
    );
    toast.success("Album link copied");
  } catch {
    toast.error("Could not copy the link. Copy the album address from your browser.");
  }
}
