/**
 * Отзиви от хора, сготвили рецепти от книгата. Снимката отива в
 * public/otzivi/, а тук се добавя ред. Секцията на лендинга се показва
 * автоматично, щом има поне един отзив.
 */
export type Testimonial = {
  name: string;
  recipe: string;
  text: string;
  /** Път в public/, например "/otzivi/maria.jpg". */
  photo: string;
};

export const TESTIMONIALS: Testimonial[] = [];
