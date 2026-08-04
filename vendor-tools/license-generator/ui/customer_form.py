import tkinter as tk
from tkinter import ttk

class CustomerForm(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent)
        self.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Variables
        self.var_customer = tk.StringVar()
        self.var_company = tk.StringVar()
        self.var_email = tk.StringVar()
        self.var_plan = tk.StringVar(value="Enterprise")
        self.var_expires = tk.StringVar(value="2030-12-31T23:59:59Z")
        self.var_machine = tk.StringVar()
        
        self.create_widgets()

    def create_widgets(self):
        row = 0
        
        ttk.Label(self, text="Customer Name:").grid(row=row, column=0, sticky=tk.W, pady=2)
        ttk.Entry(self, textvariable=self.var_customer, width=40).grid(row=row, column=1, sticky=tk.W, pady=2)
        row += 1
        
        ttk.Label(self, text="Company:").grid(row=row, column=0, sticky=tk.W, pady=2)
        ttk.Entry(self, textvariable=self.var_company, width=40).grid(row=row, column=1, sticky=tk.W, pady=2)
        row += 1
        
        ttk.Label(self, text="Email:").grid(row=row, column=0, sticky=tk.W, pady=2)
        ttk.Entry(self, textvariable=self.var_email, width=40).grid(row=row, column=1, sticky=tk.W, pady=2)
        row += 1
        
        ttk.Label(self, text="Plan Type:").grid(row=row, column=0, sticky=tk.W, pady=2)
        ttk.Combobox(self, textvariable=self.var_plan, values=["Community", "Professional", "Enterprise", "Ultimate"], state="readonly").grid(row=row, column=1, sticky=tk.W, pady=2)
        row += 1
        
        ttk.Label(self, text="Expiry (ISO8601):").grid(row=row, column=0, sticky=tk.W, pady=2)
        ttk.Entry(self, textvariable=self.var_expires, width=40).grid(row=row, column=1, sticky=tk.W, pady=2)
        row += 1
        
        ttk.Label(self, text="Machine Fingerprint:").grid(row=row, column=0, sticky=tk.W, pady=2)
        ttk.Entry(self, textvariable=self.var_machine, width=50).grid(row=row, column=1, sticky=tk.W, pady=2)
        row += 1

        # Features Section
        ttk.Label(self, text="Features & Limits:").grid(row=row, column=0, sticky=tk.W, pady=10)
        row += 1
        
        features_frame = ttk.Frame(self)
        features_frame.grid(row=row, column=0, columnspan=2, sticky=tk.EW)
        
        self.feature_vars = {}
        
        # Boolean features
        bool_features = ["Analytics", "Reports", "Alerts", "Rules", "Notifications", "AI Widgets", "Dashboard Builder", "Commands", "OTA", "Mobile Support"]
        
        f_row = 0
        f_col = 0
        for feat in bool_features:
            var = tk.BooleanVar(value=True)
            self.feature_vars[feat] = var
            ttk.Checkbutton(features_frame, text=feat, variable=var).grid(row=f_row, column=f_col, sticky=tk.W, padx=5, pady=2)
            f_col += 1
            if f_col > 2:
                f_col = 0
                f_row += 1
                
        f_row += 1
        # Numeric Limits
        num_limits = {"max_organizations": 100, "max_tenants": 500, "max_projects": 1000, "max_gateways": 50, "max_devices": 2500, "max_users": 100}
        
        l_row = f_row
        l_col = 0
        for limit, default_val in num_limits.items():
            ttk.Label(features_frame, text=f"{limit}:").grid(row=l_row, column=l_col, sticky=tk.W, padx=5, pady=2)
            var = tk.IntVar(value=default_val)
            self.feature_vars[limit] = var
            ttk.Entry(features_frame, textvariable=var, width=10).grid(row=l_row, column=l_col+1, sticky=tk.W, padx=5, pady=2)
            l_row += 1

    def get_data(self):
        features = {}
        for k, v in self.feature_vars.items():
            features[k] = v.get()
            
        return {
            "customer_name": self.var_customer.get().strip(),
            "company": self.var_company.get().strip(),
            "email": self.var_email.get().strip(),
            "plan": self.var_plan.get().strip(),
            "expires_at": self.var_expires.get().strip(),
            "machine_fingerprint": self.var_machine.get().strip(),
            "features": features
        }
