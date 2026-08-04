import tkinter as tk
from tkinter import ttk, messagebox
import json
from ui.customer_form import CustomerForm
from services.generator import generate_license, save_license_file
from services.archive import save_to_archive

class MainWindow(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("LocalIoTCloud - Vendor License Generator")
        self.geometry("700x750")
        
        self.create_widgets()
        
    def create_widgets(self):
        notebook = ttk.Notebook(self)
        notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        tab_generate = ttk.Frame(notebook)
        notebook.add(tab_generate, text="Generate License")
        
        self.customer_form = CustomerForm(tab_generate)
        
        # Action Buttons
        btn_frame = ttk.Frame(tab_generate)
        btn_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Button(btn_frame, text="Preview & Generate License", command=self.generate_license_action).pack(side=tk.RIGHT)
        
        # Preview Text
        self.preview_text = tk.Text(tab_generate, height=15, wrap=tk.NONE)
        self.preview_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

    def generate_license_action(self):
        data = self.customer_form.get_data()
        
        if not data["customer_name"] or not data["machine_fingerprint"]:
            messagebox.showerror("Error", "Customer Name and Machine Fingerprint are required!")
            return
            
        try:
            # Generate the signed payload
            final_license = generate_license(
                customer_name=data["customer_name"],
                company=data["company"],
                email=data["email"],
                plan=data["plan"],
                expires_at=data["expires_at"],
                machine_fingerprint=data["machine_fingerprint"],
                features=data["features"]
            )
            
            # Show preview
            self.preview_text.delete(1.0, tk.END)
            self.preview_text.insert(tk.END, json.dumps(final_license, indent=2))
            
            # Ask confirmation to save
            if messagebox.askyesno("Confirm", "Sign and Export .lic file?"):
                file_path = save_license_file(final_license, data["customer_name"])
                save_to_archive(final_license, file_path)
                messagebox.showinfo("Success", f"License exported successfully to:\n{file_path}")
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate license:\n{str(e)}")
