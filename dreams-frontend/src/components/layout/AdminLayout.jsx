const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:ml-64">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;

