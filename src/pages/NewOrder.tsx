import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, CreditCard, Banknote, Clock, Calculator, User, Phone, Mail, MapPin, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { customerDb, Customer } from "@/lib/customerDatabase";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};

type ServiceCategory = "Dry Cleaning" | "Laundry" | "Shoe Repairs" | "Alterations";

type PaymentMethod = "cash" | "card" | "on_collection";

interface CashPayment {
  notes: Record<string, number>; // denomination -> quantity
  coins: Record<string, number>; // denomination -> quantity
  totalPaid: number;
  change: number;
}

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const SOUTH_AFRICAN_NOTES = [
  { value: 200, label: "R200", color: "bg-amber-100 border-amber-300 text-amber-800" },
  { value: 100, label: "R100", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { value: 50, label: "R50", color: "bg-red-100 border-red-300 text-red-800" },
  { value: 20, label: "R20", color: "bg-orange-100 border-orange-300 text-orange-800" },
  { value: 10, label: "R10", color: "bg-green-100 border-green-300 text-green-800" },
];

const SOUTH_AFRICAN_COINS = [
  { value: 5, label: "R5", color: "bg-gray-100 border-gray-400 text-gray-800" },
  { value: 2, label: "R2", color: "bg-yellow-100 border-yellow-400 text-yellow-800" },
  { value: 1, label: "R1", color: "bg-zinc-100 border-zinc-400 text-zinc-800" },
];

const PAYMENT_OPTIONS = [
  {
    id: "cash" as PaymentMethod,
    name: "Cash",
    icon: Banknote,
    description: "Pay with cash",
    color: "text-green-600"
  },
  {
    id: "card" as PaymentMethod,
    name: "Card",
    icon: CreditCard,
    description: "Pay with credit/debit card",
    color: "text-blue-600"
  },
  {
    id: "on_collection" as PaymentMethod,
    name: "On Collection",
    icon: Clock,
    description: "Pay when collecting items",
    color: "text-orange-600"
  }
];

const ITEMS_DATA = {
  "Dry Cleaning": [
    { id: "dress", name: "Dress", price: 12.0, icon: "👗" },
    { id: "blazer", name: "Blazer", price: 14.0, icon: "🧥" },
    { id: "sweater", name: "Sweater", price: 10.0, icon: "🧶" },
    { id: "shorts", name: "Shorts", price: 8.0, icon: "🩳" },
    { id: "shirt", name: "Shirt", price: 9.0, icon: "👕" },
    { id: "dress-red", name: "Dress", price: 12.0, icon: "👗" },
    { id: "pants", name: "Pants", price: 11.0, icon: "👖" },
    { id: "gloves", name: "Gloves", price: 6.0, icon: "🧤" },
    { id: "bowtie", name: "Bow Tie", price: 5.0, icon: "🎀" },
    { id: "scarf", name: "Scarf", price: 7.0, icon: "🧣" },
    { id: "jacket", name: "Jacket", price: 15.0, icon: "🧥" },
    { id: "tshirt", name: "T-Shirt", price: 8.0, icon: "👕" },
    { id: "dress-pink", name: "Dress", price: 12.0, icon: "👗" },
    { id: "polo", name: "Polo", price: 9.0, icon: "👔" },
    { id: "jeans", name: "Jeans", price: 11.0, icon: "👖" },
    { id: "hat", name: "Hat", price: 6.0, icon: "🎩" },
    { id: "hoodie", name: "Hoodie", price: 13.0, icon: "🧥" },
    { id: "suit-jacket", name: "Suit Jacket", price: 16.0, icon: "🧥" },
    { id: "shirt-green", name: "Shirt", price: 9.0, icon: "👕" },
    { id: "denim-jacket", name: "Denim Jacket", price: 14.0, icon: "🧥" },
    { id: "joggers", name: "Joggers", price: 10.0, icon: "👖" },
  ],
};

const STAIN_TAGS = [
  "Hole",
  "Button Broken",
  "Button Missing",
  "Collar Torn",
  "Color Loss",
  "Cuff Torn",
  "Tear",
  "Faded",
  "Mud",
  "Biro",
  "Bleach",
  "Paint",
  "Coffee",
  "Color Bleed",
  "Food",
  "Wine",
  "Ink",
  "Make-up",
];

const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Cream", value: "#F5F5DC" },
  { name: "Gray", value: "#808080" },
  { name: "Brown", value: "#8B4513" },
  { name: "Blue", value: "#0000FF" },
  { name: "Navy", value: "#000080" },
  { name: "Green", value: "#008000" },
  { name: "Red", value: "#FF0000" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Pink", value: "#FFC0CB" },
  { name: "Orange", value: "#FFA500" },
  { name: "Purple", value: "#800080" },
];

const NewOrder = () => {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("Dry Cleaning");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: "blazer", name: "Blazer", price: 14.0, quantity: 1 },
    { id: "shirt", name: "Oxford Shirt", price: 12.0, quantity: 2, notes: "Collar Torn/Mud" },
  ]);
  const [isExpress, setIsExpress] = useState(false);
  const [selectedStains, setSelectedStains] = useState<string[]>(["Button Broken"]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentError, setShowPaymentError] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [customerValidated, setCustomerValidated] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(true);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cashPayment, setCashPayment] = useState<CashPayment>({
    notes: {},
    coins: {},
    totalPaid: 0,
    change: 0
  });

  const categories: ServiceCategory[] = ["Dry Cleaning", "Laundry", "Shoe Repairs", "Alterations"];

  const handleItemClick = (item: typeof ITEMS_DATA["Dry Cleaning"][0]) => {
    const existingItem = orderItems.find((i) => i.id === item.id);
    if (existingItem) {
      setOrderItems(orderItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setOrderItems([...orderItems, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const getItemQuantity = (id: string) => {
    return orderItems.find((item) => item.id === id)?.quantity || 0;
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateCashTotal = (notes: Record<string, number>, coins: Record<string, number>) => {
    const notesTotal = Object.entries(notes).reduce((sum, [denomination, quantity]) => {
      return sum + (parseInt(denomination) * quantity);
    }, 0);
    
    const coinsTotal = Object.entries(coins).reduce((sum, [denomination, quantity]) => {
      return sum + (parseInt(denomination) * quantity);
    }, 0);
    
    return notesTotal + coinsTotal;
  };

  const updateCashDenomination = (type: 'notes' | 'coins', denomination: string, quantity: number) => {
    setCashPayment(prev => {
      const updated = {
        ...prev,
        [type]: {
          ...prev[type],
          [denomination]: Math.max(0, quantity)
        }
      };
      
      // Remove zero quantities
      if (updated[type][denomination] === 0) {
        delete updated[type][denomination];
      }
      
      // Recalculate totals
      const totalPaid = calculateCashTotal(updated.notes, updated.coins);
      const orderTotal = calculateTotal();
      const change = Math.max(0, totalPaid - orderTotal);
      
      return {
        ...updated,
        totalPaid,
        change
      };
    });
  };

  const resetCashPayment = () => {
    setCashPayment({
      notes: {},
      coins: {},
      totalPaid: 0,
      change: 0
    });
  };

  const validateCustomerDetails = () => {
    if (!customerDetails.name.trim()) {
      toast.error("Customer name is required");
      return false;
    }
    if (!customerDetails.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    return true;
  };  const handleCustomerSubmit = () => {
    if (validateCustomerDetails()) {
      // Save customer to database
      const customer = customerDb.saveCustomer(customerDetails);
      setSelectedCustomer(customer);
      setCustomerValidated(true);
      setShowCustomerModal(false);
      setShowCustomerSearch(false);
      toast.success("Customer details saved! Now select payment method.");
    }
  };

  const handleCustomerSearch = (query: string) => {
    setCustomerSearchQuery(query);
    if (query.trim()) {
      const results = customerDb.searchCustomers(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const selectExistingCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDetails({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    });
    setCustomerValidated(true);
    setShowCustomerSearch(false);
    toast.success(`Selected customer: ${customer.name}`);
  };

  const addNewCustomer = () => {
    setShowCustomerSearch(false);
    setShowCustomerModal(true);
  };

  const resetCustomerDetails = () => {
    setCustomerDetails({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setCustomerValidated(false);
    setSelectedCustomer(null);
    setShowCustomerSearch(true);
    setCustomerSearchQuery('');
    setSearchResults([]);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    // Check if customer details are captured first
    if (!customerValidated) {
      setShowCustomerModal(true);
      return;
    }

    if (method === 'cash') {
      handleCashPaymentSelect();
    } else {
      setSelectedPaymentMethod(method);
      setShowPaymentError(false);
    }
  };

  const handleCashPaymentSelect = () => {
    // Customer validation should already be done before reaching here
    setSelectedPaymentMethod('cash');
    setShowPaymentError(false);
    setShowCashModal(true);
    resetCashPayment();
  };

  const confirmCashPayment = () => {
    const orderTotal = calculateTotal();
    if (cashPayment.totalPaid < orderTotal) {
      toast.error("Insufficient payment amount");
      return;
    }
    setShowCashModal(false);
    toast.success(`Cash payment confirmed. Change: R${cashPayment.change.toFixed(2)}`);
  };

  const handleSubmit = () => {
    // Validate customer details are captured
    if (!customerValidated) {
      setShowCustomerModal(true);
      toast.error("Please enter customer details first.");
      return;
    }

    // Validate payment method is selected
    if (!selectedPaymentMethod) {
      setShowPaymentError(true);
      toast.error("Please select a payment method before submitting the order.");
      return;
    }

    // For cash payments, validate that sufficient payment was provided
    if (selectedPaymentMethod === 'cash') {
      const orderTotal = calculateTotal();
      if (cashPayment.totalPaid < orderTotal) {
        toast.error("Please complete cash payment first.");
        setShowCashModal(true);
        return;
      }
    }

    setShowPaymentError(false);

    const order = {
      id: `#${Math.floor(Math.random() * 1000)}`,
      customer: customerDetails,
      items: orderItems,
      total: calculateTotal(),
      paymentMethod: selectedPaymentMethod,
      cashPaymentDetails: selectedPaymentMethod === 'cash' ? cashPayment : undefined,
      isExpress,
      status: "To-Do",
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage for now
    const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    localStorage.setItem("orders", JSON.stringify([...existingOrders, order]));

    // Update customer order statistics
    if (selectedCustomer) {
      customerDb.updateCustomerOrderStats(selectedCustomer.phone);
    }

    const paymentMethodName = PAYMENT_OPTIONS.find(p => p.id === selectedPaymentMethod)?.name;
    let description = `Order ${order.id} - R${order.total.toFixed(2)} (${paymentMethodName})`;
    
    if (selectedPaymentMethod === 'cash') {
      description += ` | Change: R${cashPayment.change.toFixed(2)}`;
    }

    toast.success(`Order created for ${customerDetails.name}!`, {
      description: description,
    });

    // Reset form
    setOrderItems([]);
    setSelectedStains([]);
    setIsExpress(false);
    setSelectedPaymentMethod(null);
    setShowPaymentError(false);
    resetCashPayment();
    resetCustomerDetails();
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background">
      {/* Left Panel - Item Selection */}
      <div className="flex-1 overflow-auto p-6">
        {/* Service Category Tabs */}
        <div className="flex gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "ghost"}
              onClick={() => setActiveCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="grid grid-cols-7 gap-4 mb-8">
          {ITEMS_DATA[activeCategory]?.map((item) => {
            const quantity = getItemQuantity(item.id);
            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleItemClick(item)}
                  className="w-full aspect-square bg-card rounded-2xl border-2 border-border hover:border-primary transition-all flex items-center justify-center text-4xl relative group"
                >
                  {item.icon}
                  {quantity > 0 && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                      {quantity}
                    </div>
                  )}
                </button>
                {quantity > 0 && (
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-muted hover:bg-destructive text-foreground hover:text-destructive-foreground rounded-full p-1 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
          
          {/* Add Item Button */}
          <button className="w-full aspect-square bg-card rounded-2xl border-2 border-dashed border-border hover:border-primary transition-all flex flex-col items-center justify-center gap-1">
            <Plus className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add Item</span>
          </button>
          
          {/* Barcode Button */}
          <button className="w-full aspect-square bg-card rounded-2xl border-2 border-border hover:border-primary transition-all flex flex-col items-center justify-center gap-1">
            <div className="text-2xl">|||</div>
            <span className="text-xs text-muted-foreground">by Barcode</span>
          </button>
        </div>

        {/* Stain/Damage Tags */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STAIN_TAGS.map((tag) => (
              <Button
                key={tag}
                variant={selectedStains.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setSelectedStains((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className="rounded-full"
              >
                {tag}
              </Button>
            ))}
          </div>

          {/* Color Selection */}
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color.name}
                className="h-8 w-8 rounded-full border-2 border-border hover:border-primary transition-all"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Order Summary */}
      <div className="w-96 bg-card border-l border-border flex flex-col">
        <div className="p-6 flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Express</span>
              <Switch checked={isExpress} onCheckedChange={setIsExpress} />
            </div>
          </div>

          {orderItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No items added yet</p>
              <p className="text-sm mt-2">Select items from the grid to add them to your order</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="bg-secondary rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.quantity}</span>
                      <span className="text-muted-foreground">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border space-y-4">
          {/* Customer Details Section */}
          <div className="space-y-3 mb-4">
            <h3 className="text-sm font-medium text-foreground">Customer Details</h3>
            
            {!customerValidated ? (
              <div className="p-3 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <User className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="text-sm">Customer information required</p>
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-primary text-xs"
                      onClick={() => {
                        setShowCustomerSearch(true);
                        // Load all customers for initial display
                        setSearchResults(customerDb.getAllCustomers().slice(0, 5));
                      }}
                    >
                      Click to search or add customer
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{customerDetails.name}</p>
                      <p className="text-sm text-green-600">{customerDetails.phone}</p>
                      {customerDetails.address && (
                        <p className="text-sm text-green-600">{customerDetails.address}</p>
                      )}
                      {customerDetails.email && (
                        <p className="text-xs text-green-600">{customerDetails.email}</p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowCustomerModal(true);
                    }}
                    className="text-green-700 hover:text-green-800"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Payment Method</h3>
            
            {showPaymentError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Please select a payment method to proceed with your order.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-2">
              {PAYMENT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedPaymentMethod === option.id;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handlePaymentMethodSelect(option.id)}
                    disabled={!customerValidated}
                    className={`
                      w-full p-3 rounded-lg border-2 transition-all text-left
                      ${!customerValidated 
                        ? 'border-muted bg-muted/30 cursor-not-allowed opacity-50' 
                        : isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : option.color}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {option.name}
                          {option.id === 'cash' && selectedPaymentMethod === 'cash' && cashPayment.totalPaid > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (R{cashPayment.totalPaid.toFixed(2)})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                          {option.id === 'cash' && selectedPaymentMethod === 'cash' && cashPayment.change > 0 && (
                            <span className="text-green-600 ml-2">
                              Change: R{cashPayment.change.toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quick Drop (3)</span>
            <button className="text-primary hover:underline">Retry</button>
          </div>
          
          <Button
            className={`
              w-full h-14 text-lg font-semibold transition-all
              ${selectedPaymentMethod && customerValidated
                ? 'bg-success hover:bg-success/90 text-success-foreground' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
              }
            `}
            onClick={handleSubmit}
            disabled={orderItems.length === 0 || !selectedPaymentMethod || !customerValidated}
          >
            {!customerValidated 
              ? `Add Customer Details - R${calculateTotal().toFixed(2)}`
              : selectedPaymentMethod 
              ? `Submit R${calculateTotal().toFixed(2)} (${PAYMENT_OPTIONS.find(p => p.id === selectedPaymentMethod)?.name})`
              : `Select Payment - R${calculateTotal().toFixed(2)}`
            }
          </Button>
        </div>
      </div>

      {/* Customer Search Modal */}
      <Dialog open={showCustomerSearch} onOpenChange={setShowCustomerSearch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Customer
            </DialogTitle>
            <DialogDescription>
              Search for existing customers or add a new one
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="customerSearch">Search by name or phone number</Label>
              <Input
                id="customerSearch"
                placeholder="Type to search customers..."
                value={customerSearchQuery}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Found customers:</Label>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => selectExistingCustomer(customer)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-xs text-muted-foreground">{customer.email}</p>
                          )}
                          {customer.address && (
                            <p className="text-xs text-muted-foreground">{customer.address}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{customer.totalOrders} orders</p>
                          {customer.lastOrderDate && (
                            <p>Last: {new Date(customer.lastOrderDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Customer */}
            <div className="pt-4 border-t">
              <Button
                onClick={addNewCustomer}
                className="w-full"
                variant="outline"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>
            </div>

            {/* No results message */}
            {customerSearchQuery && searchResults.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <p>No customers found matching "{customerSearchQuery}"</p>
                <p className="text-sm">Try a different search term or add a new customer</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Details Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Customer
            </DialogTitle>
            <DialogDescription>
              Please enter customer information for this order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                placeholder="Enter phone number"
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="Enter email address"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address (Optional)</Label>
              <Input
                id="customerAddress"
                placeholder="Enter customer address"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomerModal(false);
                  // If editing and they cancel, don't reset validation status
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCustomerSubmit}
                className="flex-1"
                disabled={!customerDetails.name.trim() || !customerDetails.phone.trim()}
              >
                {customerValidated ? 'Update Details' : 'Save Details'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cash Payment Modal */}
      <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cash Payment - R{calculateTotal().toFixed(2)}
            </DialogTitle>
            <DialogDescription>
              Select the notes and coins received from the customer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Order Total</p>
                <p className="text-lg font-bold">R{calculateTotal().toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-lg font-bold text-blue-600">R{cashPayment.totalPaid.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Change</p>
                <p className={`text-lg font-bold ${cashPayment.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R{cashPayment.change.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Notes Selection */}
            <div>
              <h3 className="font-medium mb-3">Notes</h3>
              <div className="grid grid-cols-5 gap-3">
                {SOUTH_AFRICAN_NOTES.map((note) => {
                  const quantity = cashPayment.notes[note.value.toString()] || 0;
                  return (
                    <div key={note.value} className="text-center">
                      <div className={`border-2 rounded-lg p-3 mb-2 ${note.color}`}>
                        <p className="font-bold text-lg">{note.label}</p>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCashDenomination('notes', note.value.toString(), quantity - 1)}
                          disabled={quantity === 0}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCashDenomination('notes', note.value.toString(), quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coins Selection */}
            <div>
              <h3 className="font-medium mb-3">Coins</h3>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {SOUTH_AFRICAN_COINS.map((coin) => {
                  const quantity = cashPayment.coins[coin.value.toString()] || 0;
                  return (
                    <div key={coin.value} className="text-center">
                      <div className={`border-2 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-2 ${coin.color}`}>
                        <p className="font-bold">{coin.label}</p>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCashDenomination('coins', coin.value.toString(), quantity - 1)}
                          disabled={quantity === 0}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCashDenomination('coins', coin.value.toString(), quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCashModal(false);
                  setSelectedPaymentMethod(null);
                  resetCashPayment();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmCashPayment}
                disabled={cashPayment.totalPaid < calculateTotal()}
                className="flex-1"
              >
                {cashPayment.totalPaid < calculateTotal() 
                  ? `Need R${(calculateTotal() - cashPayment.totalPaid).toFixed(2)} more`
                  : 'Confirm Payment'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewOrder;
