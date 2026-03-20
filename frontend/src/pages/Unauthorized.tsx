import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-red-500">403</h1>
                <p className="mt-4 text-xl text-gray-700">
                    Bạn không có quyền truy cập trang này
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
                        className="rounded-xl bg-red-500 px-6 py-2 text-white hover:bg-red-600"
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;