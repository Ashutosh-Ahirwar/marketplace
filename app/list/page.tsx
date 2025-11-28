import ListAppForm from "@/components/ListAppForm";

export default function ListPage() {
  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          List Your App
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Submit your Mini App to the marketplace. 
          {/* Removed the line about Verified Authors */}
          Your listing will appear in the "Just In" section immediately.
        </p>
      </div>
      
      <ListAppForm />
    </main>
  );
}