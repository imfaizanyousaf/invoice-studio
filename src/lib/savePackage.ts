import Package from "@/lib/models/package";
import connectDB from "./mongodb";

interface PackageData {
  UserId: string;
  name: string;
  price: number;
  requests: number;
}

export const savePackage = async (packageData: PackageData): Promise<void> => {
    try {
        await connectDB();
        const pack = await Package.findOne({ UserId: packageData.UserId }).sort({ createdAt: -1 }).limit(1);
        if (pack) {
            pack.name = packageData.name;
            pack.requests += packageData.requests;
            pack.price += packageData.price;
            await pack.save();
            console.log('Package updated successfully:', pack);
            return;
        }
        const newPackage = new Package(packageData);
        await newPackage.save();
        console.log('Package saved successfully:', newPackage);
    } catch (error) {
        console.error('Error saving package:', error);
    }
};
