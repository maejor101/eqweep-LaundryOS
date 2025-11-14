interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: Date;
  totalOrders: number;
  lastOrderDate?: Date;
}

class CustomerDatabase {
  private storageKey = 'laundromat-customers';

  // Get all customers
  getAllCustomers(): Customer[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored).map((customer: any) => ({
        ...customer,
        createdAt: new Date(customer.createdAt),
        lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined
      }));
    } catch {
      return [];
    }
  }

  // Save customers to localStorage
  private saveCustomers(customers: Customer[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(customers));
  }

  // Search customers by name or phone
  searchCustomers(query: string): Customer[] {
    const customers = this.getAllCustomers();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return customers;
    
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.phone.includes(searchTerm)
    );
  }

  // Find customer by exact phone number
  findByPhone(phone: string): Customer | undefined {
    const customers = this.getAllCustomers();
    return customers.find(customer => customer.phone === phone);
  }

  // Add or update customer
  saveCustomer(customerData: { name: string; phone: string; email?: string; address?: string }): Customer {
    const customers = this.getAllCustomers();
    const existingIndex = customers.findIndex(c => c.phone === customerData.phone);
    
    if (existingIndex >= 0) {
      // Update existing customer
      customers[existingIndex] = {
        ...customers[existingIndex],
        name: customerData.name,
        email: customerData.email,
        address: customerData.address
      };
      this.saveCustomers(customers);
      return customers[existingIndex];
    } else {
      // Create new customer
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        createdAt: new Date(),
        totalOrders: 0
      };
      customers.push(newCustomer);
      this.saveCustomers(customers);
      return newCustomer;
    }
  }

  // Update customer order statistics
  updateCustomerOrderStats(phone: string): void {
    const customers = this.getAllCustomers();
    const customerIndex = customers.findIndex(c => c.phone === phone);
    
    if (customerIndex >= 0) {
      customers[customerIndex].totalOrders += 1;
      customers[customerIndex].lastOrderDate = new Date();
      this.saveCustomers(customers);
    }
  }

  // Get customer by ID
  getCustomerById(id: string): Customer | undefined {
    const customers = this.getAllCustomers();
    return customers.find(c => c.id === id);
  }

  // Delete customer (for admin purposes)
  deleteCustomer(id: string): boolean {
    const customers = this.getAllCustomers();
    const filtered = customers.filter(c => c.id !== id);
    
    if (filtered.length !== customers.length) {
      this.saveCustomers(filtered);
      return true;
    }
    return false;
  }
}

export const customerDb = new CustomerDatabase();
export type { Customer };