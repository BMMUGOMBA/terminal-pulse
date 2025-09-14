// Sidebar content component
  function SidebarContent() {
    return (
      <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900">Terminal Pulse</div>
            <div className="text-xs text-gray-500">POS Monitoring Platform</div>
          </div>
        </div>

        {/* Current user info */}
        <div className="px-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {currentUser.fullName}
                </div>
                <div className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                  {currentUser.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`nav-item w-full text-left ${
                  isActive ? 'active bg-primary-50 text-primary-700' : ''
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            © 2025 Stanbic Bank Zimbabwe
          </div>
        </div>
      </div>
    );
  }
};

export default DashboardLayout;