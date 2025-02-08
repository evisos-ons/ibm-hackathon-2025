import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Gift } from "lucide-react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const StudentVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    // Mock API call
    setTimeout(() => {
      setVouchers([
        { id: 1, shop: "Tech Store", discount: "20% Off", location: "Downtown" },
        { id: 2, shop: "Café Bliss", discount: "Buy 1 Get 1 Free", location: "Campus Road" },
        { id: 3, shop: "Book Haven", discount: "15% Off", location: "Library Lane" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">🎓 Student Vouchers</h1>
      <BarcodeScannerComponent
        width={300}
        height={300}
        onUpdate={(err, result) => {
          if (result) setScanResult(result.text);
        }}
      />
      {scanResult && <p className="text-green-600">Scanned: {scanResult}</p>}
      {loading ? (
        <p>Loading vouchers...</p>
      ) : (
        vouchers.map((voucher) => (
          <Card key={voucher.id} className="mb-4 p-4 border rounded-lg shadow-lg">
            <CardContent>
              <h2 className="text-lg font-semibold flex items-center">
                <Gift className="mr-2 text-green-500" /> {voucher.shop}
              </h2>
              <p className="text-gray-600">{voucher.discount}</p>
              <p className="flex items-center text-sm text-gray-500">
                <MapPin className="mr-1" /> {voucher.location}
              </p>
              <Button className="mt-2 bg-blue-500 text-white">Claim</Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default StudentVouchers;
