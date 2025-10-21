/**
 * DataPreviewTable - 数据预览表格
 *
 * 功能说明：
 * 1. 显示导入数据的前几行预览
 * 2. 帮助用户确认数据格式是否正确
 */

interface DataPreviewTableProps {
  /** Excel文件的字段列表 */
  fileFields: string[];
  /** 导入的数据（完整数据） */
  importData: any[];
  /** 预览行数，默认5行 */
  previewRows?: number;
}

export default function DataPreviewTable({
  fileFields,
  importData,
  previewRows = 5,
}: DataPreviewTableProps) {
  const previewData = importData.slice(0, previewRows);

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3">数据预览（前{previewRows}条）</h3>
      <div className="border border-gray-200 rounded-lg overflow-auto max-h-60">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {fileFields.map((field) => (
                <th
                  key={field}
                  className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap"
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row: any, index: number) => (
              <tr key={index} className="border-t border-gray-200">
                {fileFields.map((field) => (
                  <td key={field} className="px-3 py-2 text-gray-600 whitespace-nowrap">
                    {String(row[field])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
