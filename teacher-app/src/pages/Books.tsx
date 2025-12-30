export default function Books() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Books</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Book
        </button>
      </div>
      <div className="bg-white rounded-lg shadow">
        <p className="p-6 text-gray-600">No books yet. Create your first book to get started.</p>
      </div>
    </div>
  );
}
