function DeleteConfirmModal({ onCancel, onConfirm }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 transition-opacity duration-200">
        <div className="bg-white rounded-lg shadow-lg w-80 p-6 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Confirm Delete
          </h3>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Are you sure you want to delete this task?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm rounded bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default DeleteConfirmModal;
  