import { Package, Search, BarChart3, Menu, X, Upload, Check, Clock, Zap, X as XIcon, Edit3, LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { toast } from 'sonner';
import { uploadToCloudinary } from './cloudinary';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { signOut } from 'firebase/auth';
import { NITK_LOCATIONS } from './locations';
import HeatmapView from './HeatMap';

interface LostItem {
  id: string;
  image: string;
  name: string;
  location: string;
  raw_description: string;
  category: string;
  status: 'lost' | 'found' | 'resolved';
  dateAdded: string;
}

interface FoundItem {
  id: string;
  image: string;
  name: string;
  location: string;
  raw_description: string;
  category: string; 
  dateFound: string;
  status: 'returned' | 'not-returned' | 'resolved';
}

export interface MatchedItem {
  id: string;
  name: string;
  image: string;
  location: string;
  category: string;
  rawDescription: string;
  matchPercentage: number;
  matchStatus: "pending" | "confirmed" | "rejected";
  matchedType: "lost" | "found";
  ownerUserId: string;
  ownerUserEmail?: string;
  ownerUserPhone?: string;
  ownerUserName?: string;
  reportedDate: string;
}


export default function Dashboard() {
  const [matchedLostItems, setMatchedLostItems] = useState<MatchedItem[]>([]);
  const [matchedFoundItems, setMatchedFoundItems] = useState<MatchedItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'home' | 'lost' | 'found' | 'dashboard' | 'heatmap'>('home');
  const {user} = useAuth();
  const [selectedLostItem, setSelectedLostItem] = useState<LostItem | null>(null);
  const [selectedFoundItem, setSelectedFoundItem] = useState<FoundItem | null>(null);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [lostFormData, setLostFormData] = useState({
    image: null as File | null,
    name: '',
    raw_description: '',
    category: '',
    location: '',
  });
  
  const [foundFormData, setFoundFormData] = useState({
    image: null as File | null,
    name: '',
    raw_description: '',
    category: '',
    location: '',
  });

  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);

  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // setLoading(true);

      const [lost, found] = await Promise.all([
        fetchUserLostItems(user.uid),
        fetchUserFoundItems(user.uid),
      ]);

      setLostItems(lost as LostItem[]);
      setFoundItems(found as FoundItem[]);

      // setLoading(false);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (activeView === "heatmap") {
      getHeatmapData().then(setHeatmapPoints);
    }
  }, [activeView]);

  useEffect(() => {
    if (!user) return;
    
    const loadUserProfile = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserProfile(userData);
          setPhoneNumber(userData.phoneNumber || '');
        } else {
          const newUserProfile = {
            uid: user.uid,
            name: user.displayName || '',
            email: user.email || '',
            image: user.photoURL || '',
            phoneNumber: '',
            createdAt: new Date()
          };
          
          await updateDoc(userRef, newUserProfile);
          setUserProfile(newUserProfile);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    };
    
    loadUserProfile();
  }, [user]);

  useEffect(() => {
    if (!user || activeView !== "dashboard") return;

    const loadData = async () => {
      const [lost, found] = await Promise.all([
        fetchUserLostItems(user.uid),
        fetchUserFoundItems(user.uid),
      ]);

      setLostItems(lost as LostItem[]);
      setFoundItems(found as FoundItem[]);
    };

    loadData();
  }, [activeView, user]);


  const checkPhoneNumber = () => {
    if (!userProfile?.phoneNumber || userProfile.phoneNumber.trim() === '') {
      toast.error("Please update your phone number before creating lost or found items");
      return false;
    }
    return true;
  };

  async function fetchUser(userId: string) {
    const snap = await getDoc(doc(db, "users", userId));
    return snap.exists() ? snap.data() : null;
  }

  const logoutUser = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const handlePhoneEdit = () => {
    setIsEditingPhone(true);
  };

  const handlePhoneSave = async () => {
    if (!user || !userProfile) return;
    
    const cleanedPhone = phoneNumber.replace(/\D/g, ''); 
    if (cleanedPhone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        phoneNumber: cleanedPhone
      });
      
      setUserProfile({
        ...userProfile,
        phoneNumber: cleanedPhone
      });
      
      setPhoneNumber(cleanedPhone);
      setIsEditingPhone(false);
      toast.success("Phone number updated successfully");
    } catch (error) {
      console.error("Error updating phone number:", error);
      toast.error("Failed to update phone number");
    }
  };

  const handlePhoneCancel = () => {
    setPhoneNumber(userProfile?.phoneNumber || '');
    setIsEditingPhone(false);
  };

  useEffect(() => {
    if (!selectedLostItem) return;

    fetchMatchedFoundItems(selectedLostItem.id)
      .then(setMatchedFoundItems);

  }, [selectedLostItem]);

  useEffect(() => {
    if (!selectedFoundItem) return;

    fetchMatchedLostItems(selectedFoundItem.id)
      .then(setMatchedLostItems);

  }, [selectedFoundItem]);



  async function fetchMatchedFoundItems(lostItemId: string): Promise<MatchedItem[]> {
    const lostRef = doc(db, "lost_items", lostItemId);
    const lostSnap = await getDoc(lostRef);

    if (!lostSnap.exists()) return [];

    const matches = lostSnap.data().matches || [];

    const resolved = await Promise.all(
      matches.map(async (m: any) => {
        const foundSnap = await getDoc(doc(db, "found_items", m.itemId));
        if (!foundSnap.exists()) return null;

        const data = foundSnap.data();
        const user = await fetchUser(m.userId);
        return {
          id: foundSnap.id,
          image: data.image,
          name: data.name,
          rawDescription: data.rawDescription,
          location: data.location,
          category: data.category,
          matchedType: "found" as const,
          matchStatus: "pending" as const,
          reportedDate: data.createdAt?.toDate().toISOString().split("T")[0] || '',
          matchPercentage: Math.round(m.score * 100),
          ownerUserId: m.userId,
          ownerUserEmail: user?.email || '',
          ownerUserPhone: user?.phoneNumber || '',
          ownerUserName: user?.name || '',
        };
      })
    );

    return resolved.filter(Boolean) as MatchedItem[];
  }

  async function fetchMatchedLostItems(foundItemId: string): Promise<MatchedItem[]> {
    const foundRef = doc(db, "found_items", foundItemId);
    const foundSnap = await getDoc(foundRef);

    if (!foundSnap.exists()) return [];

    const matches = foundSnap.data().matches || [];

    const resolved = await Promise.all(
      matches.map(async (m: any) => {
        const lostSnap = await getDoc(doc(db, "lost_items", m.itemId));
        if (!lostSnap.exists()) return null;

        const data = lostSnap.data();
        const user = await fetchUser(m.userId);
        return {
          id: lostSnap.id,
          image: data.image,
          name: data.name,
          rawDescription: data.rawDescription,
          location: data.location,
          category: data.category,
          matchedType: "lost" as const,
          matchStatus: "pending" as const,
          reportedDate: data.createdAt?.toDate().toISOString().split("T")[0] || '',
          matchPercentage: Math.round(m.score * 100),
          ownerUserId: m.userId,
          ownerUserEmail: user?.email || '',
          ownerUserPhone: user?.phoneNumber || '',
          ownerUserName: user?.name || '',
        };
      })
    );

    return resolved.filter(Boolean) as MatchedItem[];
  }



  async function getHeatmapData() {
    const snapshot = await getDocs(collection(db, "lost_items"));

    const counts: Record<string, number> = {};

    snapshot.docs.forEach((doc) => {
      const location = doc.data().location;
      if (!location || !NITK_LOCATIONS[location]) return;
      counts[location] = (counts[location] || 0) + 1;
    });

    return Object.entries(counts).map(([location, count]) => ({
      location: NITK_LOCATIONS[location],
      weight: count,
    }));
  }

  const [lostCarouselIndex, setLostCarouselIndex] = useState(0);
  const [foundCarouselIndex, setFoundCarouselIndex] = useState(0);

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

  const fetchUserLostItems = async (userId: string) => {
    const q = query(
      collection(db, "lost_items"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateAdded: doc.data().createdAt?.toDate().toISOString().split("T")[0] || '',
    }));
  };

  const fetchUserFoundItems = async (userId: string) => {
    const q = query(
      collection(db, "found_items"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateFound: doc.data().createdAt?.toDate().toISOString().split("T")[0] || '',
    }));
  };

  const handleLostSubmit = async(e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (!checkPhoneNumber()) {
      return;
    }

    if (!lostFormData.image) {
      toast.error("Please upload an image");
      return;
    }

    const toastId = toast.loading("Uploading item...");
    try {

      const uploadRes = await uploadToCloudinary(lostFormData.image);

      const image = uploadRes.secure_url;

      await addDoc(collection(db, "lost_items"), {
        userId: user.uid,
        name: lostFormData.name,
        rawDescription: lostFormData.raw_description,
        semanticDescription: "",
        category: lostFormData.category,
        image: image,
        // location: {
        //   lat: lostFormData.location.lat,
        //   lng: lostFormData.location.lng,
        // },
        location: lostFormData.location,
        status: "active",
        embeddingId: null,
        createdAt: serverTimestamp(),
      });

      toast.success("Lost item reported successfully!", { id: toastId });

      setLostFormData({
        image: null,
        name: "",
        location: "",
        category: "",
        raw_description: "",
      });

      setActiveView("dashboard");
    } catch (error) {
      console.error("Lost item submit error:", error);
      toast.error("Failed to report lost item", { id: toastId });
    }
  };

  const handleFoundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (!checkPhoneNumber()) {
      return;
    }

    if (!foundFormData.image) {
      toast.error("Please upload an image");
      return;
    }

    const toastId = toast.loading("Uploading found item...");
    try {
      const uploadRes = await uploadToCloudinary(foundFormData.image);
      const image = uploadRes.secure_url;
      await addDoc(collection(db, "found_items"), {
        userId: user.uid,
        name: foundFormData.name,
        rawDescription: foundFormData.raw_description,
        semanticDescription: "", 
        category: foundFormData.category,
        image: image,
        // location: {
        //   lat: foundFormData.location.lat,
        //   lng: foundFormData.location.lng,
        // },
        location: foundFormData.location,
        status: "active", // active | returned | matched
        embeddingId: null,
        createdAt: serverTimestamp(),
      });

      toast.success("Found item reported successfully!",{ id: toastId });

      setFoundFormData({
        image: null,
        name: "",
        location: "",
        category: "",
        raw_description: "",
      });

      setActiveView("dashboard");
    } catch (error) {
      console.error("Found item submit error:", error);
      toast.error("Failed to report found item", { id: toastId });
    }
  };

  const toggleFoundItemStatus = async (itemId: string) => {
    try {
      const item = foundItems.find(i => i.id === itemId);
      if (!item) return;

      const newStatus = (item.status === 'returned' || item.status === 'resolved') ? 'not-returned' : 'returned';
      
      await updateDoc(doc(db, "found_items", itemId), {
        status: newStatus
      });

      setFoundItems(foundItems.map(item =>
        item.id === itemId
          ? { ...item, status: newStatus }
          : item
      ));
      
      toast.success(`Item marked as ${newStatus === 'returned' ? 'returned' : 'not returned'}`);
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error("Failed to update item status");
    }
  };

  const handleLostCarouselPrev = () => {
    setLostCarouselIndex(Math.max(0, lostCarouselIndex - 3));
  };

  const handleLostCarouselNext = () => {
    setLostCarouselIndex(Math.min(lostItems.length - 1, lostCarouselIndex + 3));
  };

  const handleFoundCarouselPrev = () => {
    setFoundCarouselIndex(Math.max(0, foundCarouselIndex - 3));
  };

  const handleFoundCarouselNext = () => {
    setFoundCarouselIndex(Math.min(foundItems.length - 1, foundCarouselIndex + 3));
  };

  const markAsReturned = async (
    sourceItemId: string,
    matchedItemId: string,
    isLostItemMode: boolean
  ) => {
    const sourceType = isLostItemMode ? "lost_items" : "found_items";
    const targetType = isLostItemMode ? "found_items" : "lost_items"
    await updateDoc(doc(db, sourceType, sourceItemId), {
      status: "resolved",
    });
    await updateDoc(doc(db, targetType, matchedItemId), {
      status: "resolved",
    });

    toast.success("Item marked as returned ");
  };


  const MatchedItemsModal = ({ 
    isOpen, 
    onClose, 
    sourceItem, 
    matchedItems, 
    isLostItemMode 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    sourceItem: LostItem | FoundItem | null; 
    matchedItems: MatchedItem[]; 
    isLostItemMode: boolean;
  }) => {
    if (!isOpen || !sourceItem) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-2xl border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-800/50 border-b border-slate-700/50 p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isLostItemMode ? 'Matching Found Items' : 'Matching Lost Items'}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {isLostItemMode 
                    ? `We found ${matchedItems.length} items that match your lost item`
                    : `We found ${matchedItems.length} lost items that match this item`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <XIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="p-8 border-b border-slate-700/50 bg-slate-800/20">
            <p className="text-sm text-gray-400 mb-4 font-semibold uppercase tracking-wide">You {isLostItemMode ? 'Lost' : 'Found'}:</p>
            <div className="flex gap-6">
              <div className="w-40 h-40 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
                <img 
                  src={sourceItem.image} 
                  alt={sourceItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">{sourceItem.name}</h3>
                <p className="text-gray-400 text-lg mb-4">{sourceItem.location}</p>
                <p className="text-sm text-gray-500">
                  {isLostItemMode ? `Reported: ${'dateAdded' in sourceItem ? sourceItem.dateAdded : ''}` : `Found: ${'dateFound' in sourceItem ? sourceItem.dateFound : ''}`}
                </p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 gap-6">
              {matchedItems.length > 0 ? (
                matchedItems.map((item, _) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10 group"
                  >
                    <div className="flex gap-6">
                      <div className="w-48 h-40 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                              <p className="text-gray-400">{item.location}</p>
                              <div>
                              <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                              <p className="text-gray-400">{item.location}</p>

                              {item.ownerUserName && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {isLostItemMode ? "Found by" : "Reported by"}{" "}
                                  <span className="text-gray-300 font-medium">
                                    {item.ownerUserName}
                                  </span>
                                </p>
                              )}

                              {item.ownerUserPhone && (
                                <p className="text-xs text-green-400 mt-1">
                                  Phone: {item.ownerUserPhone}
                                </p>
                              )}

                              {item.ownerUserEmail && item.matchStatus === "confirmed" && (
                                <p className="text-xs text-blue-400 mt-1">
                                  Contact: {item.ownerUserEmail}
                                </p>
                              )}
                            </div>

                            </div>
                            <div className="flex flex-col items-center">
                              <div className="relative w-24 h-24 flex items-center justify-center">
                                <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                                  <circle 
                                    cx="50" 
                                    cy="50" 
                                    r="45" 
                                    fill="none" 
                                    stroke="#334155" 
                                    strokeWidth="6"
                                  />
                                  <circle 
                                    cx="50" 
                                    cy="50" 
                                    r="45" 
                                    fill="none" 
                                    stroke={item.matchPercentage >= 80 ? '#10b981' : item.matchPercentage >= 70 ? '#f59e0b' : '#ef4444'} 
                                    strokeWidth="6"
                                    strokeDasharray={`${item.matchPercentage * 2.83} 283`}
                                    strokeLinecap="round"
                                    className="transition-all duration-500"
                                  />
                                </svg>
                                <div className="text-center z-10">
                                  <p className={`text-2xl font-bold ${item.matchPercentage >= 80 ? 'text-green-400' : item.matchPercentage >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {item.matchPercentage}%
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">Match</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mt-4">
                            {isLostItemMode ? 'Found' : 'Reported'}: {item.reportedDate}
                          </p>
                        </div>

                        <div className="flex gap-3 mt-6">
                        <button
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/50 rounded-lg text-blue-300 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all font-medium"
                        >
                          View Details
                        </button>

                        {item.matchStatus !== "confirmed" ? (
                          <button
                            onClick={() =>
                              markAsReturned(
                                sourceItem.id,
                                item.id,
                                isLostItemMode
                              )
                            }
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-500/60 rounded-lg text-green-300 hover:from-green-500/40 hover:to-emerald-500/40 transition-all font-semibold"
                          >
                            Mark as Returned
                          </button>
                        ) : (
                          <div className="flex-1 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 font-semibold text-center">
                            ✔ Returned
                          </div>
                        )}
                      </div>

                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No matches found yet. Check back soon!</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-700/50 p-8 bg-slate-800/20">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
        {sidebarOpen && (
          <div className="fixed left-0 top-20 h-[calc(100vh-80px)] w-80 bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-r border-slate-700/50 backdrop-blur-sm px-6 py-6 flex flex-col">
            
            {userProfile && (
              <div className="mb-6 pb-5 border-b border-slate-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    {userProfile.image ? (
                      <img 
                        src={userProfile.image} 
                        alt={userProfile.name || "User"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {userProfile.name || user?.displayName || "User"}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {userProfile.email || user?.email}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Phone Number</label>
                    
                    {isEditingPhone ? (
                      <div className="space-y-3">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Enter 10-digit phone number"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handlePhoneSave}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handlePhoneCancel}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:border-slate-600/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full opacity-70"></div>
                            <span className="text-white font-medium">
                              {userProfile.phoneNumber ? (
                                userProfile.phoneNumber
                              ) : (
                                <span className="text-slate-500">No phone number added</span>
                              )}
                            </span>
                          </div>
                          <button
                            onClick={handlePhoneEdit}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-blue-400 opacity-0 group-hover:opacity-100"
                            title="Edit phone number"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {!userProfile.phoneNumber && (
                          <div className="mt-2 text-xs text-slate-500">
                            Required to report lost or found items
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <nav className="space-y-2 flex-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Navigation</div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const handleNavClick = () => {
                  if ((item.id === 'lost' || item.id === 'found') && !checkPhoneNumber()) {
                    return;
                  }
                  setActiveView(item.id as any);
                };
                return (
                  <button
                    key={item.id}
                    onClick={handleNavClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative ${
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-lg'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50'
                    }`}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-lg"></div>}
                    <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="text-base font-medium transition-all">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-slate-700/50">
              <button 
                onClick={logoutUser}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-200 font-medium rounded-lg transition-all duration-300 group"
              >
                <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        <div className={`flex-1 ${sidebarOpen ? 'ml-80' : 'ml-0'} transition-all duration-300`}>
          <div className="p-0 min-h-[calc(100vh-80px)]">
            {activeView === 'home' && (
              <div className="w-full h-full">
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-[calc(100vh-80px)] overflow-hidden">
                  <div className="grid grid-cols-2 gap-12 p-12 items-center min-h-[600px]">
                    <div className="space-y-10">
                      <div>
                        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                          Welcome Back!
                        </h1>
                        <p className="text-lg text-gray-300 leading-relaxed">
                          You're all set to find lost items and help others recover theirs. Choose an option from the sidebar to get started on your ReFind journey.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/70 transition-all group">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-400 text-sm font-medium">Lost Items</p>
                            <div className="w-2 h-2 bg-red-400 rounded-full opacity-70"></div>
                          </div>
                          <p className="text-3xl font-bold text-white group-hover:text-red-400 transition-colors">{lostItems.length}</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/70 transition-all group">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-400 text-sm font-medium">Found Items</p>
                            <div className="w-2 h-2 bg-green-400 rounded-full opacity-70"></div>
                          </div>
                          <p className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">{foundItems.length}</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/70 transition-all group">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-400 text-sm font-medium">Resolved</p>
                            <div className="w-2 h-2 bg-blue-400 rounded-full opacity-70"></div>
                          </div>
                          <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{lostItems.filter(i => i.status === 'resolved').length}</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:bg-slate-800/70 transition-all group">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-400 text-sm font-medium">Active</p>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full opacity-70 animate-pulse"></div>
                          </div>
                          <p className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors">{foundItems.filter(i => i.status !== 'resolved' && i.status !== 'returned').length}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"></div>
                          <p className="text-sm font-bold text-slate-300 uppercase tracking-wide">Quick Actions</p>
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              if (!checkPhoneNumber()) return;
                              setActiveView('lost');
                            }}
                            className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-lg text-slate-200 transition-all font-medium text-left flex items-center justify-between group"
                          >
                            <span>Report Lost Item</span>
                            <span className="group-hover:translate-x-1 transition-transform text-slate-400">→</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!checkPhoneNumber()) return;
                              setActiveView('found');
                            }}
                            className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-lg text-slate-200 transition-all font-medium text-left flex items-center justify-between group"
                          >
                            <span>Report Found Item</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </button>
                          <button
                            onClick={() => setActiveView('dashboard')}
                            className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-lg text-slate-200 transition-all font-medium text-left flex items-center justify-between group"
                          >
                            <span>Go to Dashboard</span>
                            <span className="group-hover:translate-x-1 transition-transform text-slate-400">→</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center relative h-96">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl absolute"></div>
                        <div className="w-48 h-48 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl absolute top-20 left-10"></div>
                      </div>

                      <div className="relative z-10 flex items-center justify-center h-full">
                        <div className="relative" style={{ width: '200px', height: '380px' }}>
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-32 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 rounded-3xl shadow-2xl border-2 border-slate-400 relative overflow-hidden">
                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-white/50 rounded-full blur-md"></div>
                            <div className="absolute top-8 left-5 w-5 h-5 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded shadow-lg shadow-cyan-500/70 border border-cyan-400">
                              <div className="absolute inset-0.5 bg-cyan-600 rounded"></div>
                              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                            </div>

                            <div className="absolute top-8 right-5 w-5 h-5 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded shadow-lg shadow-cyan-500/70 border border-cyan-400">
                              <div className="absolute inset-0.5 bg-cyan-600 rounded"></div>
                              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                            </div>

                            <div className="absolute -top-6 left-6 w-1.5 h-6 bg-gradient-to-t from-slate-500 to-slate-300 rounded-full shadow-lg">
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/80"></div>
                            </div>

                            <div className="absolute -top-6 right-6 w-1.5 h-6 bg-gradient-to-t from-slate-500 to-slate-300 rounded-full shadow-lg">
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-lg shadow-purple-400/80"></div>
                            </div>

                            <div className="absolute bottom-4 left-5 right-5 h-0.5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-full"></div>
                          </div>


                          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-48 h-36 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-700 rounded-3xl shadow-2xl border-2 border-slate-500 relative">
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-10 bg-white/25 rounded-full blur-lg"></div>

                            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-28 h-28 bg-gradient-to-br from-slate-600 to-slate-900 rounded-2xl shadow-inner border-2 border-slate-700">
                              
                              <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex gap-3">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/70 animate-pulse"></div>
                                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/70 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-lg shadow-green-500/70 animate-pulse" style={{animationDelay: '0.6s'}}></div>
                              </div>

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
                            <div className="absolute -left-3 top-6 w-5 h-20 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow-lg border border-slate-500"></div>
                            <div className="absolute -right-3 top-6 w-5 h-20 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow-lg border border-slate-500"></div>
                          </div>

                          <div className="absolute top-36 -left-6 w-6 h-28 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow-lg border border-slate-500 transform -rotate-40" style={{ transformOrigin: 'top right' }}>
                            <div className="absolute top-10 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"></div>

                            <div className="absolute -top-4 -left-2 w-4 h-4 bg-gradient-to-br from-slate-300 to-slate-500 rounded shadow-md border border-slate-400">
                              <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-blue-400 rounded-full"></div>
                            </div>
                          </div>

                          
                          <div className="absolute top-40 -right-5 w-6 h-24 bg-gradient-to-b from-slate-400 to-slate-600 rounded-lg shadow-lg border border-slate-500">
                            <div className="absolute top-8 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg"></div>

                            <div className="absolute bottom-0 -right-1.5 w-4 h-4 bg-gradient-to-br from-slate-300 to-slate-500 rounded shadow-md border border-slate-400">
                              <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-green-400 rounded-full"></div>
                            </div>
                          </div>

                          <div className="absolute top-72 left-1/2 transform -translate-x-1/2 w-44 h-2.5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-full shadow-lg border border-slate-500">
                            <div className="absolute inset-0 flex justify-around items-center px-4">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-lg shadow-blue-400/60"></div>
                              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/60"></div>
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg shadow-green-400/60"></div>
                            </div>
                          </div>

                          <div className="absolute top-80 left-1/2 transform -translate-x-1/2 flex gap-5 w-28">
                            <div className="w-4 h-20 bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg border border-slate-600">
                              <div className="absolute top-6 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md"></div>
                            </div>

                            <div className="w-4 h-20 bg-gradient-to-b from-slate-500 to-slate-700 rounded-lg shadow-lg border border-slate-600">
                              <div className="absolute top-6 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md"></div>
                            </div>
                          </div>

                          {/* Feet */}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-5 w-28">
                            <div className="w-5 h-3 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-lg shadow-lg border border-slate-800">
                              <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-400 opacity-70"></div>
                            </div>

                            <div className="w-5 h-3 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-lg shadow-lg border border-slate-800">
                              <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-cyan-400 opacity-70"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="absolute top-20 left-16 w-3 h-3 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded-full shadow-lg shadow-cyan-500/60 animate-pulse"></div>
                      <div className="absolute top-1/4 left-12 w-2 h-2 bg-blue-500 rounded-full shadow-md shadow-blue-500/50 animate-bounce" style={{ animationDuration: '2s' }}></div>
                      <div className="absolute bottom-32 right-14 w-3 h-3 bg-gradient-to-br from-green-300 to-green-500 rounded-full shadow-lg shadow-green-500/60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute top-1/3 right-16 w-2 h-2 bg-purple-500 rounded-full shadow-md shadow-purple-500/50 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'lost' && (
              <div className="p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <button onClick={() => setActiveView('home')} className="hover:text-slate-300 transition-colors">Dashboard</button>
                      <span>/</span>
                      <span className="text-slate-300">Report Lost Item</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Report a Lost Item</h1>
                    <p className="text-slate-400 text-lg">Provide details about your lost item and we'll help you find it using AI-powered matching.</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2">
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="bg-blue-500/20 p-2 rounded-lg">
                            <Search className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Item Details</h2>
                            <p className="text-slate-400 text-sm">The more details you provide, the better we can match your item</p>
                          </div>
                        </div>
                        <form onSubmit={handleLostSubmit} className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-slate-300 mb-3">Item Image *</label>
                              <label className="flex items-center justify-center w-full px-6 py-12 border-2 border-dashed border-blue-500/50 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-blue-500/5 group">
                                <div className="flex flex-col items-center justify-center">
                                  <Upload className="w-10 h-10 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                                  <span className="text-base font-medium text-slate-300 mb-1">Click to upload image</span>
                                  <span className="text-sm text-slate-500">PNG, JPG up to 10MB</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLostImageChange}
                                    className="hidden"
                                  />
                                </div>
                              </label>
                              {lostFormData.image && (
                                <div className="flex items-center gap-2 mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                  <Check className="w-4 h-4 text-green-400" />
                                  <span className="text-sm text-green-400 font-medium">{lostFormData.image.name}</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">Item Name *</label>
                              <input
                                type="text"
                                required
                                value={lostFormData.name}
                                onChange={(e) => setLostFormData({ ...lostFormData, name: e.target.value })}
                                placeholder="e.g., Black Leather Wallet"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">Category *</label>
                              <input
                                type="text"
                                required
                                value={lostFormData.category}
                                onChange={(e) => setLostFormData({ ...lostFormData, category: e.target.value })}
                                placeholder="e.g., Electronics, Accessories"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-slate-300 mb-2">Description *</label>
                              <textarea
                                required
                                value={lostFormData.raw_description}
                                onChange={(e) => setLostFormData({ ...lostFormData, raw_description: e.target.value })}
                                placeholder="Describe your item in detail - brand, color, size, distinctive features..."
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-slate-300 mb-2">Where did you lose it? *</label>
                              <select
                                required
                                value={lostFormData.location}
                                onChange={(e) => setLostFormData({ ...lostFormData, location: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                              >
                                <option value="" disabled className="bg-slate-800">Select a location</option>
                                {Object.keys(NITK_LOCATIONS).map((locationKey) => (
                                  <option key={locationKey} value={locationKey} className="bg-slate-800">
                                    {locationKey}
                                  </option>
                                ))}
                                <option value="Not sure" className="bg-slate-800">
                                  Not sure
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="border-t border-slate-700/50 pt-6">
                            <div className="space-y-3">
                              <button
                                type="submit"
                                disabled={!lostFormData.image || !lostFormData.name || !lostFormData.category || !lostFormData.raw_description || !lostFormData.location}
                                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                              >
                                <Search className="w-5 h-5" />
                                Submit Lost Item Report
                              </button>
                              <p className="text-xs text-slate-500 text-center">Our AI will start matching your item immediately after submission</p>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                    
                    <div>
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm sticky top-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="bg-blue-500/20 p-2 rounded-lg">
                            <Package className="w-5 h-5 text-blue-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white">Preview</h3>
                        </div>
                        
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-400">COMPLETION</span>
                            <span className="text-xs text-slate-400">
                              {Math.round(([lostFormData.image, lostFormData.name, lostFormData.category, lostFormData.raw_description, lostFormData.location].filter(Boolean).length / 5) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${([lostFormData.image, lostFormData.name, lostFormData.category, lostFormData.raw_description, lostFormData.location].filter(Boolean).length / 5) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="w-full h-48 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
                            {lostFormData.image ? (
                              <img
                                src={URL.createObjectURL(lostFormData.image)}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm">Image preview</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                              <p className="text-xs text-slate-500 font-medium mb-1">ITEM NAME</p>
                              <p className="text-white font-semibold">{lostFormData.name || 'Enter item name...'}</p>
                              {lostFormData.name && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                              <p className="text-xs text-slate-500 font-medium mb-1">CATEGORY</p>
                              <p className="text-white font-semibold">{lostFormData.category || 'Enter category...'}</p>
                              {lostFormData.category && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                              <p className="text-xs text-slate-500 font-medium mb-1">LOCATION</p>
                              <p className="text-white font-semibold">{lostFormData.location || 'Select location...'}</p>
                              {lostFormData.location && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                              <p className="text-xs text-slate-500 font-medium mb-1">DESCRIPTION</p>
                              <p className="text-white text-sm leading-relaxed">{lostFormData.raw_description || 'Enter description...'}</p>
                              {lostFormData.raw_description && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-700/50 pt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>AI matching will begin after submission</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'found' && (
              <div className="p-8">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <button onClick={() => setActiveView('home')} className="hover:text-slate-300 transition-colors">Dashboard</button>
                      <span>/</span>
                      <span className="text-slate-300">Report Found Item</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Report a Found Item</h1>
                    <p className="text-slate-400 text-lg">Help someone recover their lost belongings by reporting what you've found.</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2">
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-8 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="bg-green-500/20 p-2 rounded-lg">
                            <Package className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Found Item Details</h2>
                            <p className="text-slate-400 text-sm">Provide clear details to help us match this with someone's lost item</p>
                          </div>
                        </div>
                        
                        <form onSubmit={handleFoundSubmit} className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-slate-300 mb-3">Item Image *</label>
                              <label className="flex items-center justify-center w-full px-6 py-12 border-2 border-dashed border-green-500/50 rounded-lg cursor-pointer hover:border-green-400 transition-colors bg-green-500/5 group">
                                <div className="flex flex-col items-center justify-center">
                                  <Upload className="w-10 h-10 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                                  <span className="text-base font-medium text-slate-300 mb-1">Click to upload image</span>
                                  <span className="text-sm text-slate-500">PNG, JPG up to 10MB</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFoundImageChange}
                                    className="hidden"
                                  />
                                </div>
                              </label>
                              {foundFormData.image && (
                                <div className="flex items-center gap-2 mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                  <Check className="w-4 h-4 text-green-400" />
                                  <span className="text-sm text-green-400 font-medium">{foundFormData.image.name}</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">Item Name *</label>
                              <input
                                type="text"
                                required
                                value={foundFormData.name}
                                onChange={(e) => setFoundFormData({ ...foundFormData, name: e.target.value })}
                                placeholder="e.g., iPhone 15 Pro"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">Category *</label>
                              <input
                                type="text"
                                required
                                value={foundFormData.category}
                                onChange={(e) => setFoundFormData({ ...foundFormData, category: e.target.value })}
                                placeholder="e.g., Electronics, Accessories"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-slate-300 mb-2">Description *</label>
                              <textarea
                                required
                                value={foundFormData.raw_description}
                                onChange={(e) => setFoundFormData({ ...foundFormData, raw_description: e.target.value })}
                                placeholder="Describe the item in detail - brand, color, size, condition..."
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-semibold text-slate-300 mb-2">Where did you find it? *</label>
                              <select
                                required
                                value={foundFormData.location}
                                onChange={(e) => setFoundFormData({ ...foundFormData, location: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all"
                              >
                                <option value="" disabled className="bg-slate-800">Select a location</option>
                                {Object.keys(NITK_LOCATIONS).map((locationKey) => (
                                  <option key={locationKey} value={locationKey} className="bg-slate-800">
                                    {locationKey}
                                  </option>
                                ))}
                                <option value="Not sure" className="bg-slate-800">
                                  Not sure
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="border-t border-slate-700/50 pt-6">
                            <div className="space-y-3">
                              <button
                                type="submit"
                                disabled={!foundFormData.image || !foundFormData.name || !foundFormData.category || !foundFormData.raw_description || !foundFormData.location}
                                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                              >
                                <Package className="w-5 h-5" />
                                Submit Found Item Report
                              </button>
                              <p className="text-xs text-slate-500 text-center">We'll immediately start searching for the owner</p>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                    
                    <div>
                      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm sticky top-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="bg-green-500/20 p-2 rounded-lg">
                            <Package className="w-5 h-5 text-green-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white">Preview</h3>
                        </div>
                        
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-400">COMPLETION</span>
                            <span className="text-xs text-slate-400">
                              {Math.round(([foundFormData.image, foundFormData.name, foundFormData.category, foundFormData.raw_description, foundFormData.location].filter(Boolean).length / 5) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-500 h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${([foundFormData.image, foundFormData.name, foundFormData.category, foundFormData.raw_description, foundFormData.location].filter(Boolean).length / 5) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="w-full h-48 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
                            {foundFormData.image ? (
                              <img
                                src={URL.createObjectURL(foundFormData.image)}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-center">
                                <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm">Image preview</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                              <p className="text-xs text-slate-500 font-medium mb-1">ITEM NAME</p>
                              <p className="text-white font-semibold">{foundFormData.name || 'Enter item name...'}</p>
                              {foundFormData.name && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                              <p className="text-xs text-slate-500 font-medium mb-1">CATEGORY</p>
                              <p className="text-white font-semibold">{foundFormData.category || 'Enter category...'}</p>
                              {foundFormData.category && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                              <p className="text-xs text-slate-500 font-medium mb-1">LOCATION</p>
                              <p className="text-white font-semibold">{foundFormData.location || 'Select location...'}</p>
                              {foundFormData.location && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 relative">
                              <p className="text-xs text-slate-500 font-medium mb-1">DESCRIPTION</p>
                              <p className="text-white text-sm leading-relaxed">{foundFormData.raw_description || 'Enter description...'}</p>
                              {foundFormData.raw_description && <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>}
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-700/50 pt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>AI matching will begin after submission</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'heatmap' && (
              <div className="h-[calc(100vh-80px)] flex flex-col">
                <div className="flex-1 min-h-0">
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 h-full border border-slate-700/50 p-8 backdrop-blur-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Heatmap</h1>
                        <p className="text-gray-400">Location-based view of lost and found items around you</p>
                      </div>
                    </div>

                    <div className="flex-1 w-full rounded-lg border-2 border-slate-700 overflow-hidden min-h-[400px]">
                      {heatmapPoints.length > 0 ? (
                        <HeatmapView points={heatmapPoints} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          No heatmap data available
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            )}

            {activeView === 'dashboard' && (
              <div className="p-12">
                <div className="max-w-7xl">
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-white mb-8">Items You Lost</h2>
                  {lostItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-slate-800/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-slate-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-300 mb-2">No Lost Items Yet</h3>
                      <p className="text-slate-400 mb-6">When you lose something, report it here and we'll help you find it.</p>
                      <button
                        onClick={() => {
                          if (!checkPhoneNumber()) return;
                          setActiveView('lost');
                        }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Report Lost Item
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative">
                        {lostItems.length > 3 && (
                          <div className="flex items-center justify-center gap-4 mb-6">
                            <button
                              onClick={handleLostCarouselPrev}
                              disabled={lostCarouselIndex === 0}
                              className="p-3 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <span className="text-gray-400 text-sm">
                              {Math.floor(lostCarouselIndex / 3) + 1} of {Math.ceil(lostItems.length / 3)}
                            </span>
                            <button
                              onClick={handleLostCarouselNext}
                              disabled={lostCarouselIndex >= lostItems.length - 3}
                              className="p-3 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {lostItems.slice(lostCarouselIndex, lostCarouselIndex + 3).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedLostItem(item)}
                              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer group"
                            >
                              <div className="aspect-[4/3] bg-slate-800 overflow-hidden relative">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">View Matches</span>
                                </div>
                              </div>
                              <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-2 truncate">{item.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 truncate">{item.location}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                  <span className="text-xs text-gray-500">{item.dateAdded}</span>
                                  <div
                                    className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                                      item.status === 'resolved'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}
                                  >
                                    {item.status === 'resolved' ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        <span className="text-xs font-semibold">Returned</span>
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

                        {lostItems.length > 3 && (
                          <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: Math.ceil(lostItems.length / 3) }, (_, index) => (
                              <button
                                key={index}
                                onClick={() => setLostCarouselIndex(index * 3)}
                                className={`h-2 rounded-full transition-all ${
                                  Math.floor(lostCarouselIndex / 3) === index
                                    ? 'bg-blue-500 w-8'
                                    : 'bg-slate-700 w-2 hover:bg-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-white mb-8">Items You Found</h2>
                  {foundItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-slate-800/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <Package className="w-10 h-10 text-slate-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-300 mb-2">No Found Items Yet</h3>
                      <p className="text-slate-400 mb-6">When you find something, report it here to help others recover their belongings.</p>
                      <button
                        onClick={() => {
                          if (!checkPhoneNumber()) return;
                          setActiveView('found');
                        }}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Report Found Item
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative">
                        {foundItems.length > 3 && (
                          <div className="flex items-center justify-center gap-4 mb-6">
                            <button
                              onClick={handleFoundCarouselPrev}
                              disabled={foundCarouselIndex === 0}
                              className="p-3 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <span className="text-gray-400 text-sm">
                              {Math.floor(foundCarouselIndex / 3) + 1} of {Math.ceil(foundItems.length / 3)}
                            </span>
                            <button
                              onClick={handleFoundCarouselNext}
                              disabled={foundCarouselIndex >= foundItems.length - 3}
                              className="p-3 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {foundItems.slice(foundCarouselIndex, foundCarouselIndex + 3).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedFoundItem(item)}
                              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer group"
                            >
                              <div className="aspect-[4/3] bg-slate-800 overflow-hidden relative">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">View Matches</span>
                                </div>
                              </div>
                              <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-2 truncate">{item.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 truncate">{item.location}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mb-4">
                                  <span className="text-xs text-gray-500">{item.dateFound}</span>
                                </div>
                                <div className="space-y-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFoundItemStatus(item.id);
                                    }}
                                    className={`w-full px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                                      item.status === 'returned' || item.status === 'resolved'
                                        ? 'bg-green-500/30 text-green-400 border border-green-500/50 hover:bg-green-500/40'
                                        : 'bg-slate-700/50 text-gray-300 border border-slate-600 hover:border-green-500/50 hover:bg-slate-700'
                                    }`}
                                  >
                                    {item.status === 'returned' || item.status === 'resolved' ? '✓ Returned' : 'Not Returned'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {foundItems.length > 3 && (
                          <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: Math.ceil(foundItems.length / 3) }, (_, index) => (
                              <button
                                key={index}
                                onClick={() => setFoundCarouselIndex(index * 3)}
                                className={`h-2 rounded-full transition-all ${
                                  Math.floor(foundCarouselIndex / 3) === index
                                    ? 'bg-green-500 w-8'
                                    : 'bg-slate-700 w-2 hover:bg-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                        )}
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

      <MatchedItemsModal
        isOpen={!!selectedLostItem}
        onClose={() => setSelectedLostItem(null)}
        sourceItem={selectedLostItem}
        matchedItems={matchedFoundItems}
        isLostItemMode={true}
      />

      <MatchedItemsModal
        isOpen={!!selectedFoundItem}
        onClose={() => setSelectedFoundItem(null)}
        sourceItem={selectedFoundItem}
        matchedItems={matchedLostItems}
        isLostItemMode={false}
      />
    </div>
  );
}
