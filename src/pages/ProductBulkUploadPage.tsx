import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { productService } from '../../services/productService.frontend';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Upload, FileUp, AlertTriangle } from 'lucide-react';

const ProductBulkUploadPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    successCount: number;
    errorCount: number;
    errors?: string[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    if (!data.file || data.file.length === 0) return;

    const file = data.file[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: '파일 형식 오류',
        description: 'CSV 파일만 업로드 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await productService.bulkUpload(file);
      setUploadResult(result);

      toast({
        title: '업로드 완료',
        description: `성공: ${result.successCount}건, 실패: ${result.errorCount}건`,
        variant: result.errorCount > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('대량 업로드 오류:', error);
      toast({
        title: '업로드 실패',
        description: '파일을 업로드하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/products')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">대량 업로드</h1>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center">
          <FileUp className="h-5 w-5 mr-2 text-kyobo" />
          <h2 className="text-lg font-medium text-gray-900">CSV 파일 업로드</h2>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CSV 파일 선택
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-kyobo hover:text-kyobo-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-kyobo"
                    >
                      <span>파일 선택</span>
                      <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
                        {...register('file', {
                          required: '파일을 선택해주세요',
                        })}
                      />
                    </label>
                    <p className="pl-1">또는 여기에 파일을 끌어다 놓으세요</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    CSV 파일만 업로드 가능합니다. 최대 10MB
                  </p>
                </div>
              </div>
              {errors.file && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.file.message as string}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-900">
                CSV 파일 형식
              </h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>다음 열을 포함해야 합니다:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>sku (필수): 제품 고유 코드</li>
                  <li>name (필수): 제품명</li>
                  <li>category (필수): 카테고리</li>
                  <li>brand (필수): 브랜드</li>
                  <li>location (필수): 위치</li>
                  <li>quantity (필수): 수량</li>
                  <li>safetyStock (필수): 안전 재고</li>
                  <li>price (필수): 단가</li>
                </ul>
                <p className="mt-2">
                  <a
                    href="/sample.csv"
                    download
                    className="text-kyobo hover:text-kyobo-dark"
                  >
                    샘플 CSV 파일 다운로드
                  </a>
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-kyobo hover:bg-kyobo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kyobo disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </form>

          {uploadResult && (
            <div
              className={`mt-6 rounded-md p-4 ${
                uploadResult.errorCount > 0 ? 'bg-red-50' : 'bg-green-50'
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  {uploadResult.errorCount > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  ) : (
                    <div className="h-5 w-5 text-green-400">✓</div>
                  )}
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      uploadResult.errorCount > 0
                        ? 'text-red-800'
                        : 'text-green-800'
                    }`}
                  >
                    업로드 결과
                  </h3>
                  <div
                    className={`mt-2 text-sm ${
                      uploadResult.errorCount > 0
                        ? 'text-red-700'
                        : 'text-green-700'
                    }`}
                  >
                    <p>성공: {uploadResult.successCount}건</p>
                    <p>실패: {uploadResult.errorCount}건</p>

                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">오류 내역:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductBulkUploadPage;
