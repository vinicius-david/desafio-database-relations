import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products.map(product => product.id);

    const productsArray = await this.ormRepository.find({ id: In(ids) });

    return productsArray;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsData = await this.findAllById(products);

    const updatedProducts = productsData.map(productData => {
      const findProduct = products.find(
        product => product.id === productData.id,
      );

      if (!findProduct) throw new AppError('Product not found.');

      if (productData.quantity < findProduct.quantity) {
        throw new AppError('Not enough products.');
      }

      const newProduct = productData;

      newProduct.quantity -= findProduct.quantity;

      return newProduct;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
