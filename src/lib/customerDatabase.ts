import { apiClient } from './api';

export interface Customer {
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
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const customers = await apiClient.getCustomers();
      return customers.map((customer: any) => ({
        ...customer,
        createdAt: new Date(customer.createdAt),
        lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined
      }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback to localStorage for development/offline mode
      return this.getLocalStorageCustomers();
    }
  }

  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const customers = await apiClient.getCustomers(query);
      return customers.map((customer: any) => ({
        ...customer,
        createdAt: new Date(customer.createdAt),
        lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined
      }));
    } catch (error) {
      console.error('Error searching customers:', error);
      // Fallback to localStorage search
      const localCustomers = this.getLocalStorageCustomers();
      const searchTerm = query.toLowerCase().trim();
      
      if (!searchTerm) return localCustomers;
      
      return localCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.phone.includes(searchTerm)
      );
    }
  }

  async saveCustomer(customerData: { 
    name: string; 
    phone: string; 
    email?: string; 
    address?: string 
  }): Promise<Customer> {
    try {
      const customer = await apiClient.saveCustomer(customerData);
      return {
        ...customer,
        createdAt: new Date(customer.createdAt),
        lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined
      };
    } catch (error) {
      console.error('Error saving customer:', error);
      // Fallback to localStorage
      return this.saveToLocalStorage(customerData);
    }
  }

  async findByPhone(phone: string): Promise<Customer | undefined> {
    try {
      const customers = await this.searchCustomers(phone);
      return customers.find(c => c.phone === phone);
    } catch (error) {
      console.error('Error finding customer by phone:', error);
      return undefined;
    }
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    try {
      const customer = await apiClient.getCustomer(id);
      return {
        ...customer,
        createdAt: new Date(customer.createdAt),
        lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined
      };
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
      return undefined;
    }
  }

  async updateCustomerOrderStats(customerId: string): Promise<void> {
    try {
      await apiClient.updateCustomer(customerId, {}); // This will trigger stats update on backend
    } catch (error) {
      console.error('Error updating customer order stats:', error);
    }
  }

  // Fallback localStorage methods for development/offline mode
  private getLocalStorageCustomers(): Customer[] {
    const stored = localStorage.getItem('laundromat-customers');
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

  private saveToLocalStorage(customerData: { 
    name: string; 
    phone: string; 
    email?: string; 
    address?: string 
  }): Customer {
    const customers = this.getLocalStorageCustomers();
    const existingIndex = customers.findIndex(c => c.phone === customerData.phone);
    
    if (existingIndex >= 0) {
      // Update existing customer
      customers[existingIndex] = {
        ...customers[existingIndex],
        name: customerData.name,
        email: customerData.email,
        address: customerData.address
      };
      localStorage.setItem('laundromat-customers', JSON.stringify(customers));
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
      localStorage.setItem('laundromat-customers', JSON.stringify(customers));
      return newCustomer;
    }
  }
}

export const customerDb = new CustomerDatabase();