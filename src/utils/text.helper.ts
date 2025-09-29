export function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD') // tách ký tự và dấu
    .replace(/[\u0300-\u036f]/g, '') // xóa dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}