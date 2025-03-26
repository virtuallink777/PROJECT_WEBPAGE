import { parse } from "date-fns";
import { es } from "date-fns/locale";

const parseBackendDate = (date: string): Date => {
  return parse(date, "d/M/yyyy h:mm a", new Date(), { locale: es });
};

export default parseBackendDate;
