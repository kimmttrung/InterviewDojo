import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-7xl font-bold text-gray-800">404</h1>
                <p className="mt-4 text-xl text-gray-600">
                    Trang bạn tìm không tồn tại
                </p>

                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="rounded-xl bg-gray-200 px-6 py-2 text-gray-800 hover:bg-gray-300"
                    >
                        ← Quay lại
                    </button>

                    <button
                        onClick={() => navigate("/")}
                        className="rounded-xl bg-black px-6 py-2 text-white hover:bg-gray-800"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;