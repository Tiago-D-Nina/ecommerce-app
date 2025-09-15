import { useState } from "react";
import { Plus, Edit3, Trash2, CreditCard, Star } from "lucide-react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useAuthStore } from "../../../store/authStore";
import type { PaymentMethod } from "../../../types";

interface PaymentFormData {
  type: "credit" | "debit" | "pix";
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  brand?: "visa" | "mastercard" | "amex" | "elo";
  isDefault: boolean;
}

export function PaymentMethodsSection() {
  const {
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    isLoading,
  } = useAuthStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    type: "credit",
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    brand: "visa",
    isDefault: paymentMethods.length === 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      type: "credit",
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      brand: "visa",
      isDefault: paymentMethods.length === 0,
    });
    setErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.type !== "pix") {
      if (!formData.cardNumber?.trim()) {
        newErrors.cardNumber = "Número do cartão é obrigatório";
      } else if (formData.cardNumber.replace(/\s/g, "").length < 16) {
        newErrors.cardNumber = "Número do cartão inválido";
      }

      if (!formData.cardHolder?.trim()) {
        newErrors.cardHolder = "Nome no cartão é obrigatório";
      }

      if (!formData.expiryDate?.trim()) {
        newErrors.expiryDate = "Data de validade é obrigatória";
      } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = "Data inválida (use MM/AA)";
      }

      if (!formData.brand) {
        newErrors.brand = "Bandeira é obrigatória";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const groups = numbers.match(/.{1,4}/g) || [];
    return groups.join(" ").substr(0, 19); // 4 grupos de 4 dígitos com espaços
  };

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + "/" + numbers.slice(2, 4);
    }
    return numbers;
  };

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return "";
    const cleaned = cardNumber.replace(/\s/g, "");
    const lastFour = cleaned.slice(-4);
    return "**** **** **** " + lastFour;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setFormData((prev) => ({ ...prev, expiryDate: formatted }));
  };

  const handleInputChange = (
    field: keyof PaymentFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // For demonstration, we'll store only the last 4 digits
    const dataToSave = {
      ...formData,
      cardNumber:
        formData.type !== "pix" ? formData.cardNumber?.slice(-4) : undefined,
      createdAt: new Date().toISOString(),
    };

    let success = false;

    if (editingId) {
      success = await updatePaymentMethod(editingId, dataToSave);
    } else {
      success = await addPaymentMethod(dataToSave);
    }

    if (success) {
      resetForm();
    }
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setFormData({
      type: paymentMethod.type,
      cardNumber: paymentMethod.cardNumber
        ? "**** **** **** " + paymentMethod.cardNumber
        : "",
      cardHolder: paymentMethod.cardHolder || "",
      expiryDate: paymentMethod.expiryDate || "",
      brand: paymentMethod.brand,
      isDefault: paymentMethod.isDefault,
    });
    setEditingId(paymentMethod.id);
    setShowForm(true);
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (
      window.confirm("Tem certeza que deseja remover este método de pagamento?")
    ) {
      await deletePaymentMethod(paymentMethodId);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    await setDefaultPaymentMethod(paymentMethodId);
  };

  const getCardBrandIcon = (brand?: string) => {
    // In a real app, you'd use actual card brand icons
    switch (brand) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💳";
      case "elo":
        return "💳";
      default:
        return "💳";
    }
  };

  const getPaymentTypeLabel = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "credit":
        return "Cartão de Crédito";
      case "debit":
        return "Cartão de Débito";
      case "pix":
        return "PIX";
      default:
        return type;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Métodos de Pagamento
        </h2>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Método
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? "Editar Método de Pagamento" : "Adicionar Novo Método"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Pagamento
              </label>
              <select
                title="Método de Pagamento"
                value={formData.type}
                onChange={(e) =>
                  handleInputChange(
                    "type",
                    e.target.value as "credit" | "debit" | "pix"
                  )
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={isLoading}
              >
                <option value="credit">Cartão de Crédito</option>
                <option value="debit">Cartão de Débito</option>
                <option value="pix">PIX</option>
              </select>
            </div>

            {formData.type !== "pix" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Cartão *
                  </label>
                  <Input
                    type="text"
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    className={errors.cardNumber ? "border-red-500" : ""}
                    placeholder="1234 5678 9012 3456"
                    disabled={isLoading}
                  />
                  {errors.cardNumber && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.cardNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome no Cartão *
                  </label>
                  <Input
                    type="text"
                    value={formData.cardHolder}
                    onChange={(e) =>
                      handleInputChange(
                        "cardHolder",
                        e.target.value.toUpperCase()
                      )
                    }
                    className={errors.cardHolder ? "border-red-500" : ""}
                    placeholder="JOAO SILVA"
                    disabled={isLoading}
                  />
                  {errors.cardHolder && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.cardHolder}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Validade *
                    </label>
                    <Input
                      type="text"
                      value={formData.expiryDate}
                      onChange={handleExpiryDateChange}
                      className={errors.expiryDate ? "border-red-500" : ""}
                      placeholder="MM/AA"
                      disabled={isLoading}
                    />
                    {errors.expiryDate && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.expiryDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bandeira *
                    </label>
                    <select
                      title="Bandeira"
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange(
                          "brand",
                          e.target.value as
                            | "visa"
                            | "mastercard"
                            | "amex"
                            | "elo"
                        )
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      disabled={isLoading}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="elo">Elo</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {formData.type === "pix" && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-700">
                  PIX será disponibilizado como opção de pagamento no checkout.
                  Você poderá pagar usando QR Code ou chave PIX.
                </p>
              </div>
            )}

            <div className="flex items-center">
              <input
                id="isDefault"
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) =>
                  handleInputChange("isDefault", e.target.checked)
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Definir como método padrão
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Nenhum método de pagamento cadastrado
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Adicione um método para facilitar suas compras
            </p>
          </div>
        ) : (
          paymentMethods.map((paymentMethod) => (
            <div
              key={paymentMethod.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">
                    {paymentMethod.type === "pix"
                      ? "🔑"
                      : getCardBrandIcon(paymentMethod.brand)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {getPaymentTypeLabel(paymentMethod.type)}
                      </span>
                      {paymentMethod.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          <Star className="h-3 w-3 fill-current" />
                          Padrão
                        </span>
                      )}
                    </div>
                    {paymentMethod.type !== "pix" ? (
                      <>
                        <p className="text-gray-700">
                          {maskCardNumber(paymentMethod.cardNumber || "")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {paymentMethod.cardHolder} •{" "}
                          {paymentMethod.expiryDate}
                        </p>
                        <p className="text-xs text-gray-400 uppercase">
                          {paymentMethod.brand}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-700">PIX</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {!paymentMethod.isDefault && (
                    <Button
                      onClick={() => handleSetDefault(paymentMethod.id)}
                      variant="ghost"
                      size="sm"
                      className="text-primary-600 hover:text-primary-700"
                      disabled={isLoading}
                    >
                      Tornar Padrão
                    </Button>
                  )}
                  <Button
                    onClick={() => handleEdit(paymentMethod)}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(paymentMethod.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-700">
          <strong>Segurança:</strong> Por motivos de segurança, armazenamos
          apenas os últimos 4 dígitos do seu cartão. Suas informações completas
          de pagamento são processadas de forma segura durante o checkout.
        </p>
      </div>
    </div>
  );
}
