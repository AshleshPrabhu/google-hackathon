import { Package, Search, BarChart3, Menu, X, Upload, Check, Clock, Zap } from 'lucide-react';
import { useState } from 'react';

interface LostItem {
  id: string;
  image: string;
  name: string;
  company: string;
  status: 'lost' | 'found';
  dateAdded: string;
}

interface FoundItem {
  id: string;
  image: string;
  name: string;
  company: string;
  dateFound: string;
  status: 'returned' | 'not-returned';
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'home' | 'lost' | 'found' | 'dashboard' | 'heatmap'>('home');
  
  // Lost Item Form State
  const [lostFormData, setLostFormData] = useState({
    image: null as File | null,
    name: '',
    company: '',
  });
  
  // Found Item Form State
  const [foundFormData, setFoundFormData] = useState({
    image: null as File | null,
    name: '',
    company: '',
  });

  // Carousel States
  const [lostCarouselIndex, setLostCarouselIndex] = useState(0);
  const [foundCarouselIndex, setFoundCarouselIndex] = useState(0);

  // Mock data for dashboard
  const [lostItems, setLostItems] = useState<LostItem[]>([
    {
      id: '1',
      image: 'https://via.placeholder.com/200?text=Lost+Wallet',
      name: 'Black Leather Wallet',
      company: 'Coach',
      status: 'lost',
      dateAdded: '2025-12-20',
    },
    {
      id: '2',
      image: 'https://via.placeholder.com/200?text=Lost+Keys',
      name: 'Car Keys',
      company: 'Tesla',
      status: 'found',
      dateAdded: '2025-12-18',
    },
  ]);

  const [foundItems, setFoundItems] = useState<FoundItem[]>([
    {
      id: '1',
      image: 'https://via.placeholder.com/200?text=Found+Phone',
      name: 'iPhone 15 Pro',
      company: 'Apple',
      dateFound: '2025-12-19',
      status: 'not-returned',
    },
  ]);

  const menuItems = [
    { icon: Package, label: 'Home', id: 'home' },
    { icon: Search, label: 'I Lost an Item', id: 'lost' },
    { icon: Package, label: 'I Found an Item', id: 'found' },
    { icon: Zap, label: 'Heatmap', id: 'heatmap' },
    { icon: BarChart3, label: 'Dashboard', id: 'dashboard' },
  ];

  const handleLostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLostFormData({ ...lostFormData, image: e.target.files[0] });
    }
  };

  const handleFoundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFoundFormData({ ...foundFormData, image: e.target.files[0] });
    }
  };

  const handleLostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: LostItem = {
      id: Date.now().toString(),
      image: lostFormData.image ? URL.createObjectURL(lostFormData.image) : 'https://via.placeholder.com/200',
      name: lostFormData.name,
      company: lostFormData.company,
      status: 'lost',
      dateAdded: new Date().toISOString().split('T')[0],
    };
    setLostItems([...lostItems, newItem]);
    setLostFormData({ image: null, name: '', company: '' });
    alert('Lost item reported successfully!');
    setActiveView('dashboard');
  };

  const handleFoundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: FoundItem = {
      id: Date.now().toString(),
      image: foundFormData.image ? URL.createObjectURL(foundFormData.image) : 'https://via.placeholder.com/200',
      name: foundFormData.name,
      company: foundFormData.company,
      dateFound: new Date().toISOString().split('T')[0],
      status: 'not-returned',
    };
    setFoundItems([...foundItems, newItem]);
    setFoundFormData({ image: null, name: '', company: '' });
    alert('Found item reported successfully!');
    setActiveView('dashboard');
  };

  const toggleFoundItemStatus = (itemId: string) => {
    setFoundItems(foundItems.map(item =>
      item.id === itemId
        ? { ...item, status: item.status === 'returned' ? 'not-returned' : 'returned' }
        : item
    ));
  };

  const handleLostCarouselPrev = () => {
    setLostCarouselIndex(Math.max(0, lostCarouselIndex - 1));
  };

  const handleLostCarouselNext = () => {
    setLostCarouselIndex(Math.min(lostItems.length - 1, lostCarouselIndex + 1));
  };

  const handleFoundCarouselPrev = () => {
    setFoundCarouselIndex(Math.max(0, foundCarouselIndex - 1));
  };

  const handleFoundCarouselNext = () => {
    setFoundCarouselIndex(Math.min(foundItems.length - 1, foundCarouselIndex + 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent border-b border-slate-700/50">
        <div className="px-8 py-6 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <span className="text-2xl font-bold text-white">ReFind</span>
          </div>
        </div>
      </header>

      <div className="flex pt-20">
        {/* Left Sidebar */}
        {sidebarOpen && (
          <div className="fixed left-0 top-20 h-[calc(100vh-80px)] w-72 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-r border-slate-700/50 backdrop-blur-sm px-8 py-8">
            <nav className="space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`w-full flex items-center gap-4 px-6 py-3 rounded-lg transition-all duration-300 group border ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white border-blue-500/50'
                        : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-indigo-500/10 border-transparent hover:border-blue-500/30'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-blue-400 group-hover:text-blue-300'}`} />
                    <span className="text-base font-medium group-hover:font-semibold transition-all">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="absolute bottom-8 left-8 right-8 border-t border-slate-700/50 pt-8">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20">
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-0'} transition-all duration-300`}>
          <div className="p-0 min-h-[calc(100vh-80px)]">
            {/* Home View */}
            {activeView === 'home' && (
              <div className="w-full h-full">
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-[calc(100vh-80px)] overflow-hidden">
                  <div className="grid grid-cols-2 gap-8 p-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                      <div>
                        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                          Welcome Back!
                        </h1>
                        <p className="text-lg text-gray-300 leading-relaxed">
                          You're all set to find lost items and help others recover theirs. Choose an option from the sidebar to get started on your ReFind journey.
                        </p>
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 hover:bg-blue-500/15 transition-all">
                          <p className="text-blue-400 text-sm font-semibold mb-1">Lost Items</p>
                          <p className="text-2xl font-bold text-white">{lostItems.length}</p>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 hover:bg-green-500/15 transition-all">
                          <p className="text-green-400 text-sm font-semibold mb-1">Found Items</p>
                          <p className="text-2xl font-bold text-white">{foundItems.length}</p>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-500/15 transition-all">
                          <p className="text-purple-400 text-sm font-semibold mb-1">Resolved</p>
                          <p className="text-2xl font-bold text-white">{lostItems.filter(i => i.status === 'found').length}</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 hover:bg-amber-500/15 transition-all">
                          <p className="text-amber-400 text-sm font-semibold mb-1">Active</p>
                          <p className="text-2xl font-bold text-white">{foundItems.filter(i => i.status === 'not-returned').length}</p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Quick Actions</p>
                        <div className="space-y-2">
                          <button
                            onClick={() => setActiveView('lost')}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:from-blue-500/30 hover:to-indigo-500/30 hover:border-blue-400/50 transition-all font-medium text-left flex items-center justify-between group"
                          >
                            <span>Report Lost Item</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                          <button
                            onClick={() => setActiveView('found')}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg text-green-300 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 transition-all font-medium text-left flex items-center justify-between group"
                          >
                            <span>Report Found Item</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                          <button
                            onClick={() => setActiveView('dashboard')}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 transition-all font-medium text-left flex items-center justify-between group"
                          >
                            <span>Go to Dashboard</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Visual */}
                    <div className="flex items-center justify-center relative h-96">
                      {/* Animated Background */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl absolute"></div>
                        <div className="w-48 h-48 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl absolute top-20 left-10"></div>
                      </div>

                      {/* Robot Illustration - Professional & Beautiful */}
                      <div className="relative z-10 flex items-center justify-center h-full">
                        {/* Main Robot */}
                        <div className="relative" style={{ width: '200px', height: '380px' }}>
                          {/* Head - Sleek & Professional */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-32 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-3xl shadow-2xl border-2 border-slate-400 relative overflow-hidden">
                            {/* Head shine - glossy effect */}
                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-white/50 rounded-full blur-md"></div>

                            {/* Left LED Eye */}
                            <div className="absolute top-8 left-5 w-5 h-5 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded shadow-lg shadow-cyan-500/70 border border-cyan-400">
                              <div className="absolute inset-0.5 bg-cyan-600 rounded"></div>
                              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                            </div>

                            {/* Right LED Eye */}
                            <div className="absolute top-8 right-5 w-5 h-5 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded shadow-lg shadow-cyan-500/70 border border-cyan-400">
                              <div className="absolute inset-0.5 bg-cyan-600 rounded"></div>
                              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                            </div>

                            {/* Antenna left */}
                            <div className="absolute -top-6 left-6 w-1.5 h-6 bg-gradient-to-t from-slate-500 to-slate-300 rounded-full shadow-lg">
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/80"></div>
                            </div>

                            {/* Antenna right */}
                            <div className="absolute -top-6 right-6 w-1.5 h-6 bg-gradient-to-t from-slate-500 to-slate-300 rounded-full shadow-lg">
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-lg shadow-purple-400/80"></div>
                            </div>

                            {/* Mouth line */}
                            <div className="absolute bottom-4 left-5 right-5 h-0.5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-full"></div>
                          </div>

                          {/* Torso - Direct connection to head */}
                          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-48 h-36 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-700 rounded-3xl shadow-2xl border-2 border-slate-500 relative">
                            {/* Torso shine - glossy effect */}
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-10 bg-white/25 rounded-full blur-lg"></div>

                            {/* Central control panel */}
                            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-28 h-28 bg-gradient-to-br from-slate-600 to-slate-900 rounded-2xl shadow-inner border-2 border-slate-700">
                              {/* LED indicators - top row */}
                              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex gap-3">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/70 animate-pulse"></div>
                                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/70 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-lg shadow-green-500/70 animate-pulse" style={{animationDelay: '0.6s'}}></div>
                              </div>

                              {/* Circuit pattern */}
                              <div className="absolute top-12 left-3 right-3 space-y-2">
                                <div className="flex gap-2">
                                  <div className="flex-1 h-1 bg-blue-500/60 rounded"></div>
                                  <div className="flex-1 h-1 bg-cyan-500/60 rounded"></div>
                                  <div className="flex-1 h-1 bg-blue-500/60 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1 h-1 bg-cyan-500/60 rounded"></div>
                                  <div className="flex-1 h-1 bg-blue-500/60 rounded"></div>
                                  <div className="flex-1 h-1 bg-cyan-500/60 rounded"></div>
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1 h-1 bg-blue-500/60 rounded"></div>
                                  <div className="flex-1 h-1 bg-cyan-500/60 rounded"></div>
                                  <div className="flex-1 h-1 bg-blue-500/60 rounded"></div>
                                </div>
                              </div>
                            </div>

                            {/* Left shoulder */}
                            <div className="absolute -left-3 top-6 w-5 h-20 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow-lg border border-slate-500"></div>

                            {/* Right shoulder */}
                            <div className="absolute -right-3 top-6 w-5 h-20 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow-lg border border-slate-500"></div>
                          </div>

                          {/* Left Arm - Angled up */}
                          <div className="absolute top-36 -left-6 w-6 h-28 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow-lg border border-slate-500 transform -rotate-40" style={{ transformOrigin: 'top right' }}>
                            {/* Elbow joint */}
                            <div className="absolute top-10 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"></div>

                            {/* Left hand */}
                            <div className="absolute -top-4 -left-2 w-4 h-4 bg-gradient-to-br from-slate-300 to-slate-500 rounded shadow-md border border-slate-400">
                              <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-blue-400 rounded-full"></div>
                            </div>
                          </div>

                          {/* Right Arm - Down */}
                          <div className="absolute top-40 -right-5 w-6 h-24 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow-lg border border-slate-500">
                            {/* Elbow joint */}
                            <div className="absolute top-8 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"></div>

                            {/* Right hand */}
                            <div className="absolute bottom-0 -right-1.5 w-4 h-4 bg-gradient-to-br from-slate-300 to-slate-500 rounded shadow-md border border-slate-400">
                              <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-green-400 rounded-full"></div>
                            </div>
                          </div>

                          {/* Waist/Connection belt */}
                          <div className="absolute top-72 left-1/2 transform -translate-x-1/2 w-44 h-2.5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-full shadow-lg border border-slate-500">
                            <div className="absolute inset-0 flex justify-around items-center px-4">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-lg shadow-blue-400/60"></div>
                              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/60"></div>
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg shadow-green-400/60"></div>
                            </div>
                          </div>

                          {/* Legs - Professional finish */}
                          <div className="absolute top-80 left-1/2 transform -translate-x-1/2 flex gap-5 w-28">
                            {/* Left leg */}
                            <div className="w-4 h-20 bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg border border-slate-600">
                              <div className="absolute top-6 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md"></div>
                            </div>

                            {/* Right leg */}
                            <div className="w-4 h-20 bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg border border-slate-600">
                              <div className="absolute top-6 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md"></div>
                            </div>
                          </div>

                          {/* Feet */}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-5 w-28">
                            {/* Left foot */}
                            <div className="w-5 h-3 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-lg shadow-lg border border-slate-800">
                              <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-400 opacity-70"></div>
                            </div>

                            {/* Right foot */}
                            <div className="w-5 h-3 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-lg shadow-lg border border-slate-800">
                              <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-cyan-400 opacity-70"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Floating tech elements - Energy particles */}
                      <div className="absolute top-20 left-16 w-3 h-3 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded-full shadow-lg shadow-cyan-500/60 animate-pulse"></div>
                      <div className="absolute top-1/4 left-12 w-2 h-2 bg-blue-500 rounded-full shadow-md shadow-blue-500/50 animate-bounce" style={{ animationDuration: '2s' }}></div>
                      <div className="absolute bottom-32 right-14 w-3 h-3 bg-gradient-to-br from-green-300 to-green-500 rounded-full shadow-lg shadow-green-500/60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute top-1/3 right-16 w-2 h-2 bg-purple-500 rounded-full shadow-md shadow-purple-500/50 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lost Item Form */}
            {activeView === 'lost' && (
              <div className="p-12">
                <div className="grid grid-cols-2 gap-12 max-w-7xl">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-10 backdrop-blur-sm h-fit">
                  <h2 className="text-3xl font-bold text-white mb-8">Report Lost Item</h2>
                  <form onSubmit={handleLostSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Item Image</label>
                      <label className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-blue-500/50 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-blue-500/5">
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-8 h-8 text-blue-400 mb-2" />
                          <span className="text-sm text-gray-300">Click to upload image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLostImageChange}
                            className="hidden"
                          />
                        </div>
                      </label>
                      {lostFormData.image && (
                        <p className="text-sm text-green-400 mt-2">✓ {lostFormData.image.name}</p>
                      )}
                    </div>

                    {/* Item Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Name of Item</label>
                      <input
                        type="text"
                        required
                        value={lostFormData.name}
                        onChange={(e) => setLostFormData({ ...lostFormData, name: e.target.value })}
                        placeholder="e.g., Black Leather Wallet"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    {/* Company/Brand */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Company/Brand</label>
                      <input
                        type="text"
                        required
                        value={lostFormData.company}
                        onChange={(e) => setLostFormData({ ...lostFormData, company: e.target.value })}
                        placeholder="e.g., Coach, Apple, etc."
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20"
                    >
                      Submit
                    </button>
                  </form>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-10 backdrop-blur-sm h-fit flex flex-col items-center justify-center">
                  <div className="w-full h-64 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center mb-6">
                    {lostFormData.image ? (
                      <img
                        src={URL.createObjectURL(lostFormData.image)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500">Upload image to preview</p>
                      </div>
                    )}
                  </div>
                  <div className="w-full space-y-3">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-gray-500">Item Name</p>
                      <p className="text-white font-semibold">{lostFormData.name || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-white font-semibold">{lostFormData.company || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Found Item Form */}
            {activeView === 'found' && (
              <div className="p-12">
                <div className="grid grid-cols-2 gap-12 max-w-7xl">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-10 backdrop-blur-sm h-fit">
                  <h2 className="text-3xl font-bold text-white mb-8">Report Found Item</h2>
                  <form onSubmit={handleFoundSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Item Image</label>
                      <label className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-green-500/50 rounded-lg cursor-pointer hover:border-green-400 transition-colors bg-green-500/5">
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-8 h-8 text-green-400 mb-2" />
                          <span className="text-sm text-gray-300">Click to upload image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFoundImageChange}
                            className="hidden"
                          />
                        </div>
                      </label>
                      {foundFormData.image && (
                        <p className="text-sm text-green-400 mt-2">✓ {foundFormData.image.name}</p>
                      )}
                    </div>

                    {/* Item Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Name of Item</label>
                      <input
                        type="text"
                        required
                        value={foundFormData.name}
                        onChange={(e) => setFoundFormData({ ...foundFormData, name: e.target.value })}
                        placeholder="e.g., iPhone 15 Pro"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                      />
                    </div>

                    {/* Company/Brand */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Company/Brand</label>
                      <input
                        type="text"
                        required
                        value={foundFormData.company}
                        onChange={(e) => setFoundFormData({ ...foundFormData, company: e.target.value })}
                        placeholder="e.g., Apple, Samsung, etc."
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full mt-8 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-green-500/20"
                    >
                      Submit
                    </button>
                  </form>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-10 backdrop-blur-sm h-fit flex flex-col items-center justify-center">
                  <div className="w-full h-64 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center mb-6">
                    {foundFormData.image ? (
                      <img
                        src={URL.createObjectURL(foundFormData.image)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500">Upload image to preview</p>
                      </div>
                    )}
                  </div>
                  <div className="w-full space-y-3">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-gray-500">Item Name</p>
                      <p className="text-white font-semibold">{foundFormData.name || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-gray-500">Company</p>
                      <p className="text-white font-semibold">{foundFormData.company || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Heatmap View */}
            {activeView === 'heatmap' && (
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 h-full border border-slate-700/50 p-8 backdrop-blur-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Heatmap</h1>
                        <p className="text-gray-400">Location-based view of lost and found items around you</p>
                      </div>
                      <Zap className="w-12 h-12 text-yellow-400" />
                    </div>

                    {/* Placeholder Map */}
                    <div className="flex-1 w-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border-2 border-slate-700 flex items-center justify-center">
                      <div className="text-center">
                        <div className="mb-4 flex justify-center">
                          <Zap className="w-16 h-16 text-yellow-400 opacity-50" />
                        </div>
                        <p className="text-gray-400 text-lg">Heatmap coming soon</p>
                        <p className="text-gray-500 text-sm mt-2">Real-time location tracking of items in your area</p>
                      </div>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-3 gap-6 mt-6">
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                        <p className="text-blue-400 text-sm font-semibold mb-2">Hot Zones</p>
                        <p className="text-white text-2xl font-bold">12</p>
                        <p className="text-gray-400 text-xs mt-2">Areas with high activity</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                        <p className="text-red-400 text-sm font-semibold mb-2">Lost Items</p>
                        <p className="text-white text-2xl font-bold">23</p>
                        <p className="text-gray-400 text-xs mt-2">Nearby lost items</p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                        <p className="text-green-400 text-sm font-semibold mb-2">Found Items</p>
                        <p className="text-white text-2xl font-bold">18</p>
                        <p className="text-gray-400 text-xs mt-2">Nearby found items</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard View */}
            {activeView === 'dashboard' && (
              <div className="p-12">
                <div className="max-w-7xl">
                {/* Items You Lost Carousel */}
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-white mb-8">Items You Lost</h2>
                  {lostItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>No lost items reported yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Carousel Container */}
                      <div className="relative">
                        <div className="flex items-center justify-center gap-4">
                          {/* Previous Button */}
                          <button
                            onClick={handleLostCarouselPrev}
                            disabled={lostCarouselIndex === 0}
                            className="p-3 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          {/* Carousel Items */}
                          <div className="flex-1 overflow-hidden">
                            <div
                              className="flex gap-6 transition-transform duration-500 ease-out"
                              style={{
                                transform: `translateX(calc(-${lostCarouselIndex * 100}% - ${lostCarouselIndex * 24}px))`,
                              }}
                            >
                              {lostItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex-shrink-0 w-72 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                                >
                                  <div className="h-56 bg-slate-800 overflow-hidden">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                    />
                                  </div>
                                  <div className="p-6">
                                    <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                                    <p className="text-sm text-gray-400 mb-4">{item.company}</p>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                      <span className="text-xs text-gray-500">{item.dateAdded}</span>
                                      <div
                                        className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                                          item.status === 'found'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-amber-500/20 text-amber-400'
                                        }`}
                                      >
                                        {item.status === 'found' ? (
                                          <>
                                            <Check className="w-4 h-4" />
                                            <span className="text-xs font-semibold">Found</span>
                                          </>
                                        ) : (
                                          <>
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-semibold">Lost</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={handleLostCarouselNext}
                            disabled={lostCarouselIndex === lostItems.length - 1}
                            className="p-3 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Carousel Indicators */}
                        <div className="flex justify-center gap-2 mt-6">
                          {lostItems.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setLostCarouselIndex(index)}
                              className={`h-2 rounded-full transition-all ${
                                index === lostCarouselIndex
                                  ? 'bg-blue-500 w-8'
                                  : 'bg-slate-700 w-2 hover:bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items You Found Carousel */}
                <div>
                  <h2 className="text-3xl font-bold text-white mb-8">Items You Found</h2>
                  {foundItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>No found items reported yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Carousel Container */}
                      <div className="relative">
                        <div className="flex items-center justify-center gap-4">
                          {/* Previous Button */}
                          <button
                            onClick={handleFoundCarouselPrev}
                            disabled={foundCarouselIndex === 0}
                            className="p-3 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          {/* Carousel Items */}
                          <div className="flex-1 overflow-hidden">
                            <div
                              className="flex gap-6 transition-transform duration-500 ease-out"
                              style={{
                                transform: `translateX(calc(-${foundCarouselIndex * 100}% - ${foundCarouselIndex * 24}px))`,
                              }}
                            >
                              {foundItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex-shrink-0 w-72 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
                                >
                                  <div className="h-56 bg-slate-800 overflow-hidden">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                    />
                                  </div>
                                  <div className="p-6">
                                    <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                                    <p className="text-sm text-gray-400 mb-4">{item.company}</p>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mb-4">
                                      <span className="text-xs text-gray-500">{item.dateFound}</span>
                                    </div>
                                    {/* Return Status Buttons */}
                                    <div className="space-y-2">
                                      <button
                                        onClick={() => toggleFoundItemStatus(item.id)}
                                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                                          item.status === 'returned'
                                            ? 'bg-green-500/30 text-green-400 border border-green-500/50 hover:bg-green-500/40'
                                            : 'bg-slate-700/50 text-gray-300 border border-slate-600 hover:border-green-500/50 hover:bg-slate-700'
                                        }`}
                                      >
                                        {item.status === 'returned' ? '✓ Returned' : 'Not Returned'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={handleFoundCarouselNext}
                            disabled={foundCarouselIndex === foundItems.length - 1}
                            className="p-3 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Carousel Indicators */}
                        <div className="flex justify-center gap-2 mt-6">
                          {foundItems.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setFoundCarouselIndex(index)}
                              className={`h-2 rounded-full transition-all ${
                                index === foundCarouselIndex
                                  ? 'bg-green-500 w-8'
                                  : 'bg-slate-700 w-2 hover:bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
