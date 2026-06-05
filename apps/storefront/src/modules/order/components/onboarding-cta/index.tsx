import { Button, Container, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const OnboardingCta = () => {
  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full">
      <div className="flex flex-col gap-y-4 center p-4 md:items-center">
        <Text className="text-ui-fg-base text-xl">
          Votre espace client est prêt
        </Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          Retrouvez votre commande, vos informations et l&apos;activation du
          dashboard Linckup depuis le même compte.
        </Text>
        <LocalizedClientLink href="/account">
          <Button className="w-fit" size="large">
            Accéder à mon compte
          </Button>
        </LocalizedClientLink>
      </div>
    </Container>
  )
}

export default OnboardingCta
