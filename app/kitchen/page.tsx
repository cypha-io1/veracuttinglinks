'use client';

import { useState, useEffect } from 'react';
import { FiFilter, FiPrinter, FiChevronRight, FiClock, FiAlertTriangle, FiCheckCircle, FiZap, FiSearch, FiStar, FiMessageSquare, FiList } from 'react-icons/fi';
import KitchenLayout from '@/components/kitchen/KitchenLayout';

interface OrderItem {
  id: string;
  name: string;
  size: string;
  crust?: string;
  toppings: string[];
  notes?: string;
  quantity: number;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  status: 'new' | 'preparing' | 'ready' | 'completed';
  type: 'delivery' | 'pickup' | 'dine-in';
  items: OrderItem[];
  placedAt: Date;
  priority: boolean;
  branch: string;
  completedAt?: Date;
  kitchenNotes?: string;
  estimatedPrepTime?: number; // in minutes
}

export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([
    {
      id: '1',
      orderNumber: '#1001',
      status: 'new',
      type: 'delivery',
      priority: true,
      branch: 'North Legon',
      placedAt: new Date(Date.now() - 8 * 60000),
      estimatedPrepTime: 20,
      items: [
        { id: '1', name: 'Pepperoni Pizza', size: 'Large', crust: 'Thin', toppings: ['Pepperoni', 'Cheese', 'Tomato'], quantity: 1 },
        { id: '2', name: 'Fried Chicken', size: 'Regular', toppings: ['Spicy'], notes: 'Extra hot sauce', quantity: 1 },
      ],
    },
    {
      id: '2',
      orderNumber: '#1002',
      status: 'preparing',
      type: 'pickup',
      priority: false,
      branch: 'North Legon',
      placedAt: new Date(Date.now() - 5 * 60000),
      estimatedPrepTime: 15,
      items: [
        { id: '3', name: 'Margherita Pizza', size: 'Medium', crust: 'Thick', toppings: ['Mozzarella', 'Basil', 'Tomato'], quantity: 2 },
      ],
    },
    {
      id: '3',
      orderNumber: '#1003',
      status: 'ready',
      type: 'delivery',
      priority: false,
      branch: 'Accra',
      placedAt: new Date(Date.now() - 12 * 60000),
      estimatedPrepTime: 18,
      items: [
        { id: '4', name: 'BBQ Wings', size: 'Regular', toppings: ['BBQ Sauce', 'Cheese'], quantity: 1 },
      ],
    },
    {
      id: '4',
      orderNumber: '#1004',
      status: 'new',
      type: 'dine-in',
      priority: false,
      branch: 'North Legon',
      placedAt: new Date(Date.now() - 3 * 60000),
      estimatedPrepTime: 12,
      items: [
        { id: '5', name: 'Chicken Burger', size: 'Regular', toppings: ['Lettuce', 'Tomato', 'Sauce'], notes: 'No onions', quantity: 1 },
      ],
    },
  ]);

  const [filters, setFilters] = useState({
    type: 'all',
    branch: 'all',
    searchQuery: '',
    priorityOnly: false,
  });

  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'history'>('orders');
  const [kitchenNotesOrder, setKitchenNotesOrder] = useState<KitchenOrder | null>(null);
  const [kitchenNotesText, setKitchenNotesText] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [updateCounter, setUpdateCounter] = useState(0);

  // Real-time updates - triggers re-render every 1 second
  useEffect(() => {
    let callCount = 0;
    
    const interval = setInterval(() => {
      callCount++;
      setLastUpdated(new Date());
      setUpdateCounter(prev => prev + 1);

      // Auto-complete orders that have been ready for more than 5 minutes
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.status === 'ready' && order.completedAt === undefined) {
            const timeReady = Math.floor((Date.now() - order.placedAt.getTime()) / 60000);
            // Auto-mark as completed after order has been ready for 5+ minutes (customer picked up)
            if (timeReady > (order.estimatedPrepTime || 15) + 5) {
              return { ...order, status: 'completed', completedAt: new Date() };
            }
          }
          return order;
        })
      );

      // Simulate occasional new orders (every 30 seconds, 50% chance)
      if (Math.random() > 0.5 && callCount % 30 === 0) {
        const newOrderNumber = `#${1000 + Math.floor(Math.random() * 5000)}`;
        const types: Array<'delivery' | 'pickup' | 'dine-in'> = ['delivery', 'pickup', 'dine-in'];
        const branches = ['North Legon', 'Accra', 'Agbogba'];
        const items = [
          { id: '1', name: 'Pepperoni Pizza', size: 'Large', crust: 'Thin', toppings: ['Pepperoni', 'Cheese'], quantity: 1 },
          { id: '2', name: 'Margherita Pizza', size: 'Medium', crust: 'Thick', toppings: ['Mozzarella', 'Basil'], quantity: 1 },
          { id: '3', name: 'BBQ Chicken', size: 'Large', toppings: ['BBQ', 'Cheese'], quantity: 2 },
          { id: '4', name: 'Burger', size: 'Medium', toppings: ['Lettuce', 'Tomato'], quantity: 1 },
        ];
        
        setOrders(prevOrders => [
          ...prevOrders,
          {
            id: Date.now().toString(),
            orderNumber: newOrderNumber,
            status: 'new',
            type: types[Math.floor(Math.random() * types.length)],
            priority: Math.random() > 0.7,
            branch: branches[Math.floor(Math.random() * branches.length)],
            placedAt: new Date(),
            estimatedPrepTime: 12 + Math.floor(Math.random() * 8),
            items: [items[Math.floor(Math.random() * items.length)]],
          }
        ]);
      }
    }, 1000); // Update every 1 second

    return () => clearInterval(interval);
  }, []);

  const getMinutesElapsed = (date: Date) => {
    return Math.floor((Date.now() - date.getTime()) / 60000);
  };

  const isLateOrder = (order: KitchenOrder) => {
    const elapsed = getMinutesElapsed(order.placedAt);
    return order.status === 'new' && elapsed > 5;
  };

  const moveOrderStatus = (orderId: string, newStatus?: 'preparing' | 'ready') => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        if (newStatus) {
          return { ...order, status: newStatus };
        }
        // Auto-advance if no status provided
        let nextStatus: 'preparing' | 'ready' | 'completed' = 'ready';
        if (order.status === 'new') nextStatus = 'preparing';
        else if (order.status === 'preparing') nextStatus = 'ready';
        else if (order.status === 'ready') nextStatus = 'completed';
        
        const updatedOrder = { ...order, status: nextStatus };
        if (nextStatus === 'completed') {
          updatedOrder.completedAt = new Date();
        }
        return updatedOrder;
      }
      return order;
    }));
  };

  const saveKitchenNotes = (orderId: string, notes: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, kitchenNotes: notes } : order
    ));
  };

  const filteredOrders = orders.filter(order => {
    if (filters.type !== 'all' && order.type !== filters.type) return false;
    if (filters.branch !== 'all' && order.branch !== filters.branch) return false;
    if (filters.searchQuery && !order.orderNumber.includes(filters.searchQuery)) return false;
    if (filters.priorityOnly && !order.priority) return false;
    return true;
  });

  const allOrders = filteredOrders.filter(o => o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const displayOrders = activeTab === 'orders' ? allOrders : completedOrders;

  const newOrders = displayOrders.filter(o => o.status === 'new');
  const preparingOrders = displayOrders.filter(o => o.status === 'preparing');
  const readyOrders = displayOrders.filter(o => o.status === 'ready');

  const totalOrders = allOrders.length;
  const avgPrepTime = completedOrders.length > 0 
    ? Math.round(completedOrders.reduce((sum, o) => {
        const elapsed = o.completedAt && o.placedAt ? (o.completedAt.getTime() - o.placedAt.getTime()) / 60000 : 0;
        return sum + elapsed;
      }, 0) / completedOrders.length)
    : 0;

  return (
    <KitchenLayout>
      <div className="p-8 space-y-8 min-h-screen">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="New Orders"
            value={newOrders.length}
            icon={<FiAlertTriangle />}
            color="red"
            trend="+2"
          />
          <StatCard
            label="Preparing"
            value={preparingOrders.length}
            icon={<FiZap />}
            color="blue"
            trend={preparingOrders.length.toString()}
          />
          <StatCard
            label="Ready"
            value={readyOrders.length}
            icon={<FiCheckCircle />}
            color="green"
            trend="+1"
          />
          <StatCard
            label="Completed Today"
            value={completedOrders.length}
            icon={<FiCheckCircle />}
            color="gray"
            trend={avgPrepTime > 0 ? `Avg ${avgPrepTime}m` : 'N/A'}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-3 items-center bg-white p-4 rounded-2xl shadow-md border-b border-gray-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active Orders
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FiList size={18} />
            History
          </button>
          
          <div className="ml-auto flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-black font-medium">Live</span>
            </div>
            <span className="text-gray-600 font-medium">
              {activeTab === 'orders' ? `${totalOrders} active` : `${completedOrders.length} completed`}
            </span>
            <span className="text-gray-500 text-xs">
              Updated {updateCounter > 0 ? 'now' : 'just now'}
            </span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-5 rounded-2xl shadow-md space-y-4">
          <div className="flex gap-3 items-center">
            <FiSearch className="text-gray-600" size={20} />
            <input
              type="text"
              placeholder="Search by order number (e.g. #1001)"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:border-black focus:outline-none font-medium text-sm"
            />
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <FiFilter className="text-gray-600" size={20} />
            
            <button
              onClick={() => setFilters({ ...filters, priorityOnly: !filters.priorityOnly })}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-colors ${
                filters.priorityOnly
                  ? 'bg-white text-black border border-black'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <FiStar size={18} />
              Priority Only
            </button>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:border-black focus:outline-none font-medium text-sm"
            >
              <option value="all">All Types</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
              <option value="dine-in">Dine-in</option>
            </select>

            <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="px-3 py-2 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:border-black focus:outline-none font-medium text-sm"
            >
              <option value="all">All Branches</option>
              <option value="North Legon">North Legon</option>
              <option value="Accra">Accra</option>
              <option value="Agbogba">Agbogba</option>
            </select>

            {(filters.searchQuery || filters.priorityOnly) && (
              <button
                onClick={() => setFilters({ type: 'all', branch: 'all', searchQuery: '', priorityOnly: false })}
                className="ml-auto px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* NEW ORDERS */}
          <OrderColumn
            title="Incoming Orders"
            icon={<FiAlertTriangle className="text-black" />}
            count={newOrders.length}
            orders={newOrders}
            statusColor="red"
            emptyMessage="No new orders"
            onSelectOrder={setSelectedOrder}
            onMoveOrder={moveOrderStatus}
            moveLabel="Start Prep"
            onAddNotes={(order) => {
              setKitchenNotesOrder(order);
              setKitchenNotesText(order.kitchenNotes || '');
            }}
          />

          {/* PREPARING ORDERS */}
          <OrderColumn
            title="In Preparation"
            icon={<FiZap className="text-black" />}
            count={preparingOrders.length}
            orders={preparingOrders}
            statusColor="blue"
            emptyMessage="Nothing cooking"
            onSelectOrder={setSelectedOrder}
            onMoveOrder={moveOrderStatus}
            moveLabel="Ready"
            onAddNotes={(order) => {
              setKitchenNotesOrder(order);
              setKitchenNotesText(order.kitchenNotes || '');
            }}
          />

          {/* READY ORDERS */}
          <OrderColumn
            title="Ready for Pickup"
            icon={<FiCheckCircle className="text-black" />}
            count={readyOrders.length}
            orders={readyOrders}
            statusColor="green"
            emptyMessage="No orders ready"
            onSelectOrder={setSelectedOrder}
            onMoveOrder={() => {}}
            isReady={true}
            onAddNotes={(order) => {
              setKitchenNotesOrder(order);
              setKitchenNotesText(order.kitchenNotes || '');
            }}
          />
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* Kitchen Notes Modal */}
      {kitchenNotesOrder && (
        <KitchenNotesModal
          order={kitchenNotesOrder}
          notes={kitchenNotesText}
          onNotesChange={setKitchenNotesText}
          onSave={() => {
            if (kitchenNotesOrder) {
              saveKitchenNotes(kitchenNotesOrder.id, kitchenNotesText);
              setKitchenNotesOrder(null);
              setKitchenNotesText('');
            }
          }}
          onClose={() => {
            setKitchenNotesOrder(null);
            setKitchenNotesText('');
          }}
        />
      )}
    </KitchenLayout>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'red' | 'blue' | 'green' | 'gray';
  trend: string;
}

function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    red: 'bg-white text-black',
    blue: 'bg-white text-black',
    green: 'bg-white text-black',
    gray: 'bg-white text-gray-600',
  };

  const accentClasses = {
    red: 'text-black',
    blue: 'text-black',
    green: 'text-black',
    gray: 'text-gray-600',
  };

  const trendClasses = {
    red: 'bg-white text-black',
    blue: 'bg-white text-black',
    green: 'bg-white text-black',
    gray: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className={`${colorClasses[color]} p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`text-2xl ${accentClasses[color]}`}>{icon}</div>
        <span className={`${trendClasses[color]} text-xs font-semibold px-2 py-1 rounded-lg`}>
          {trend}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accentClasses[color]}`}>{value}</p>
    </div>
  );
}

interface OrderColumnProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  orders: KitchenOrder[];
  statusColor: 'red' | 'blue' | 'green';
  emptyMessage: string;
  onSelectOrder: (order: KitchenOrder) => void;
  onMoveOrder: (orderId: string, status?: 'preparing' | 'ready') => void;
  moveLabel?: string;
  isReady?: boolean;
  onAddNotes?: (order: KitchenOrder) => void;
}

function OrderColumn({
  title,
  icon,
  count,
  orders,
  statusColor,
  emptyMessage,
  onSelectOrder,
  onMoveOrder,
  moveLabel = 'Next',
  isReady = false,
  onAddNotes,
}: OrderColumnProps) {
  const accentClasses = {
    red: 'text-black',
    blue: 'text-black',
    green: 'text-black',
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-xl ${accentClasses[statusColor]}`}>{icon}</div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Queue</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
            statusColor === 'red' ? 'bg-white text-black' :
            statusColor === 'blue' ? 'bg-white text-black' :
            'bg-white text-black'
          }`}>
            {count}
          </span>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-gray-500 font-medium">{emptyMessage}</p>
            <p className="text-gray-400 text-sm mt-1">
              {isReady ? '🕐 Great job!' : '⏳ New orders will appear here'}
            </p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onSelect={onSelectOrder}
              onMove={() => onMoveOrder(order.id, order.status === 'new' ? 'preparing' : 'ready')}
              moveLabel={moveLabel}
              isReady={isReady}
              onAddNotes={onAddNotes}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: KitchenOrder;
  onSelect: (order: KitchenOrder) => void;
  onMove: () => void;
  moveLabel: string;
  isReady?: boolean;
  onAddNotes?: (order: KitchenOrder) => void;
}

function OrderCard({ order, onSelect, onMove, moveLabel, isReady = false, onAddNotes }: OrderCardProps) {
  const elapsed = Math.floor((Date.now() - order.placedAt.getTime()) / 60000);
  const isLate = elapsed > 5 && !isReady;

  return (
    <div
      className={`p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md ${
        isLate
          ? 'bg-white border border-black'
          : order.priority
          ? 'bg-white border border-black'
          : 'bg-gray-50 border border-gray-200'
      }`}
      onClick={() => onSelect(order)}
    >
      {/* Order Header */}
      <div className="flex items-start justify-between mb-3 pb-3 border-b border-current/10">
        <div>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {order.orderNumber}
            {order.priority && <FiStar size={16} className="text-black" />}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-lg font-semibold">
              {order.type.toUpperCase()}
            </span>
            <span className="text-xs text-gray-600">{order.branch}</span>
          </div>
        </div>
        <div className="text-right">
          {isLate && (
            <div className="flex items-center gap-1 text-black font-bold text-xs mb-1">
              ⚠ LATE
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-600 text-sm font-semibold">
            <FiClock size={14} />
            <span className={`${elapsed > 10 ? 'text-black' : elapsed > 5 ? 'text-black' : ''}`}>
              {elapsed}m
            </span>
          </div>
          {order.estimatedPrepTime && (
            <p className="text-xs text-gray-500 mt-1">Est. {order.estimatedPrepTime}m</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-3 text-sm">
        {order.items.slice(0, 2).map(item => (
          <div key={item.id}>
            <p className="font-semibold text-gray-900">{item.quantity}x {item.name}</p>
            <p className="text-xs text-gray-600">{item.size}</p>
          </div>
        ))}
        {order.items.length > 2 && (
          <p className="text-xs text-gray-500 italic">+{order.items.length - 2} more</p>
        )}
      </div>

      {/* Notes */}
      {order.items.some(i => i.notes) && (
        <div className="mb-3 p-2 bg-white rounded-lg text-xs text-black font-medium">
          📝 {order.items.find(i => i.notes)?.notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!isReady ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove();
            }}
            className="flex-1 bg-black hover:bg-gray-800 text-white py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {moveLabel}
            <FiChevronRight size={16} />
          </button>
        ) : (
          <div className="flex-1 bg-black text-white py-2 rounded-lg font-semibold text-sm text-center">
            ✓ Ready
          </div>
        )}
        {onAddNotes && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNotes(order);
            }}
            className="bg-white hover:bg-white text-black p-2 rounded-lg font-semibold transition-colors"
            title="Add kitchen notes"
          >
            <FiMessageSquare size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

interface OrderDetailModalProps {
  order: KitchenOrder;
  onClose: () => void;
}

function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{order.orderNumber}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white text-black text-sm font-semibold rounded-lg">
                {order.type.toUpperCase()}
              </span>
              <span className="text-gray-600 font-medium text-sm">{order.branch}</span>
              {order.priority && (
                <span className="px-3 py-1 bg-white text-black text-sm font-semibold rounded-lg">
                  ★ PRIORITY
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-gray-600 text-sm mb-1 font-medium">Status</p>
            <p className="text-2xl font-bold text-black capitalize">{order.status}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-gray-600 text-sm mb-1 font-medium">Time Elapsed</p>
            <p className="text-2xl font-bold text-black">
              {Math.floor((Date.now() - order.placedAt.getTime()) / 60000)}m
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-2xl p-4 border-l-4 border-black">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{item.quantity}x {item.name}</p>
                    <p className="text-gray-600 text-sm">{item.size}{item.crust ? ` • ${item.crust}` : ''}</p>
                  </div>
                </div>

                {item.toppings.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600 mb-2 font-semibold">Toppings:</p>
                    <div className="flex flex-wrap gap-2">
                      {item.toppings.map(topping => (
                        <span
                          key={topping}
                          className="px-3 py-1 bg-white text-black text-xs font-semibold rounded-lg"
                        >
                          {topping}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.notes && (
                  <p className="text-black text-sm font-semibold bg-white p-2 rounded-lg mt-2">
                    📝 {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <FiPrinter size={20} />
            Print Ticket
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function KitchenNotesModal({ order, notes, onNotesChange, onSave, onClose }: { order: KitchenOrder; notes: string; onNotesChange: (text: string) => void; onSave: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-2xl">
              <FiMessageSquare className="text-black" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
              <p className="text-sm text-gray-600">Kitchen Notes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl">✕</button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes for the kitchen staff..."
          className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:border-black focus:outline-none resize-none font-medium text-gray-900"
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onSave}
            className="flex-1 bg-black hover:bg-gray-800 text-white py-2.5 rounded-xl font-semibold transition-colors"
          >
            Save Notes
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-2.5 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
