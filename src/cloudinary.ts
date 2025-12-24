export const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );
    formData.append(
        "cloud_name",
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    );

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
        method: "POST",
        body: formData,
        }
    );
    console.log(res);

    if (!res.ok) throw new Error("Cloudinary upload failed");

    return await res.json(); 
};
