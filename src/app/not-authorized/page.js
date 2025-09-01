// app/not-authorized/page.tsx
export default function NotAuthorized() {
  return (
    <div className="h-screen flex items-center justify-center">
      <h1 className="text-xl font-semibold text-red-500">
        🚫 Access Denied – You are not authorized to view this page.
      </h1>
    </div>
  );
}
